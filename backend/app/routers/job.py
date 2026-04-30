import asyncio
from datetime import datetime
from collections.abc import AsyncIterable
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.sse import EventSourceResponse, ServerSentEvent
from fastapi import APIRouter, HTTPException, Request, status

from app.utils.error_wrappers import db_http_handler
from app.core.dependencies import (
    UserDep,
    NetworkDBDep,
    TrainJobManagerDep,
    rate_limiter,
)
from app.services.managers.train_job_manager import (
    ServerBusyError,
    UserQuotaExceededError,
)
from app.schemas import TrainRequest, TrainStatus
from app.core.logger import AppLogger

logger = AppLogger(__name__)

router = APIRouter()


@router.post("/train", response_model=TrainStatus)
@rate_limiter("3/minute")
async def start_train(
    request: Request,
    req: TrainRequest,
    db: NetworkDBDep,
    user: UserDep,
    job_manager: TrainJobManagerDep,
):
    network = await db_http_handler(db.get_network_by_id)(network_id=req.networkId)
    if not network:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Network not found")
    if network.get("user_id") != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your network")

    async def save_results(new_nn: dict, new_meta: dict) -> bool:
        old_meta = network.get("meta_json") or {}
        merged_meta = {
            "last_trained_at": datetime.now().isoformat(),
            "epochs_completed": min(
                new_meta.get("epochs_completed", 0)
                + old_meta.get("epochs_completed", 0),
                999999,
            ),
            "accuracy": new_meta.get("accuracy", 0.0),
            "loss": new_meta.get("final_loss", 0.0),
            "learning_rate": new_meta.get("final_learning_rate", 0.0),
        }
        try:
            await db.update_network(
                network_id=req.networkId, nn=new_nn, meta=merged_meta
            )
            return True
        except Exception as e:
            logger.error(f"DB Update failed: {e}")
            return False

    try:
        job_id = await job_manager.create_job(
            user_id=user.id,
            req=req,
            network_json=network.get("nn_json"),
            db_callback=save_results,
        )
        return TrainStatus(jobId=job_id, status="queued")

    except ServerBusyError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Server busy, try again later"
        )
    except UserQuotaExceededError:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have a job running")
    except RuntimeError:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to start training process"
        )


@router.get("/train/{job_id}/status", response_model=TrainStatus)
@rate_limiter("120/minute")
def train_status(
    request: Request,
    job_id: str,
    user: UserDep,
    job_manager: TrainJobManagerDep,
):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")

    if job.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your job")

    return TrainStatus(
        jobId=job.data["id"],
        status=job.data["status"],
        progress=job.data["progress"],
        loss=job.data["loss"] or 1000.0,
        accuracy=job.data["accuracy"] or 0.0,
        error=job.data["error"],
    )


"""
AI assisted streaming endpoint implementation.
"""


@router.get("/train/{job_id}/events", response_class=EventSourceResponse)
@rate_limiter("10/minute")
async def train_events(
    request: Request,
    job_id: str,
    user: UserDep,
    job_manager: TrainJobManagerDep,
) -> AsyncIterable[ServerSentEvent]:
    job = job_manager.get_job(job_id)

    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    if job.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your job")
    if job.data["status"] in ("done", "error"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Job already finished")

    yield ServerSentEvent(
        data={
            "type": "snapshot",
            "status": job.data["status"],
            "progress": job.data["progress"],
        }
    )

    while True:
        if await request.is_disconnected():
            break
        try:
            payload = await asyncio.wait_for(job.event_queue.get(), timeout=10.0)

            yield ServerSentEvent(data=payload)

            if payload.get("type") in ("done", "error"):
                break

        except asyncio.TimeoutError:
            if job.data["status"] in ("done", "error"):
                break
