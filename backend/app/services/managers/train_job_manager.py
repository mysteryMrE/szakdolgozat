import asyncio
import time
import uuid
from datetime import datetime
from typing import Callable, cast
from multiprocessing import get_context
from multiprocessing.context import SpawnProcess
from multiprocessing.connection import Connection

from app.core.logger import AppLogger
from app.core.config import config
from app.schemas import TrainRequest, JobState, JobContext, TrainWorkerRequest
from app.services.trainer_worker import train_worker
from ..singleton import Singleton

logger = AppLogger(__name__)

TRAINING_PROCESS_COUNT = config.get_training_process_count()
MAX_JOB_DURATION_SEC = 900
JOB_CLEANUP_AGE_SEC = 300
SSE_QUEUE_SIZE = 512
MAX_IDLE_SEC = 120


class ServerBusyError(Exception):
    pass


class UserQuotaExceededError(Exception):
    pass


"""
AI assisted implementation.
AI was used to understand documentation, generate examples of multiprocessing management,
to suggest improvements, and to help discover race conditions / edge cases.
"""


class TrainingJobManager(metaclass=Singleton):

    def __init__(self):
        # every manipulation of _jobs must be kept in the main thread
        self._jobs: dict[str, JobContext] = {}
        self._stopping_jobs: set[str] = set()

    def get_job(self, job_id: str) -> JobContext | None:
        return self._jobs.get(job_id)

    def active_count(self) -> int:
        return sum(
            1
            for job in self._jobs.values()
            if job.data["status"] in ("queued", "running")
        )

    def active_count_by_user(self, user_id: str) -> int:
        return sum(
            1
            for job in self._jobs.values()
            if job.data["status"] in ("queued", "running") and job.user_id == user_id
        )

    async def create_job(
        self, user_id: str, req: TrainRequest, network_json: dict, db_callback: Callable
    ) -> str:
        """
        Creates a job context, spawns the worker, and starts monitoring.
        Raises exceptions if server is busy or user has too many jobs.
        """
        if self.active_count() >= TRAINING_PROCESS_COUNT:
            raise ServerBusyError("Server busy")
        if self.active_count_by_user(user_id) >= 1:
            raise UserQuotaExceededError("Active job already running")

        job_id = str(uuid.uuid4())
        initial_state: JobState = {
            "id": job_id,
            "userId": user_id,
            "networkId": req.networkId,
            "method": req.method,
            "status": "queued",
            "progress": 0.0,
            "createdAt": datetime.now().isoformat(),
            "startedAt": None,
            "accuracy": None,
            "loss": None,
            "error": None,
        }

        process, conn = await asyncio.to_thread(
            self._spawn_worker,
            job_id,
            TrainWorkerRequest(network=network_json, params=req.params),
        )
        logger.info(f"[TASKMANAGER] Spawned training job {job_id} for user {user_id}")

        queue = asyncio.Queue(maxsize=SSE_QUEUE_SIZE)
        monitor_task = asyncio.create_task(
            self._monitor_process(
                job_id, process, conn, queue, initial_state, db_callback
            )
        )
        self._jobs[job_id] = JobContext(
            job_id, user_id, process, conn, queue, monitor_task, initial_state
        )
        return job_id

    async def full_cleanup(self):
        try:
            logger.info(f"[TASKMANAGER] Shutting down {len(self._jobs)} active jobs")
            await self._bulk_stop_jobs(list(self._jobs.keys()))
        except Exception as e:
            logger.error(f"[TASKMANAGER] Full cleanup failed: {e}")

    async def partial_cleanup(self):
        try:
            old_jobs = self._collect_old_jobs()
            await self._bulk_stop_jobs(old_jobs)
        except Exception as e:
            logger.error(f"[TASKMANAGER] Partial cleanup failed: {e}")

    def _collect_old_jobs(self) -> list[str]:
        now = time.time()
        to_remove_id = []
        for job_id, job in self._jobs.items():
            if job.data["status"] not in ("done", "error"):
                continue
            created_at = datetime.fromisoformat(job.data["createdAt"]).timestamp()
            if now - created_at > JOB_CLEANUP_AGE_SEC:
                to_remove_id.append(job_id)
        return to_remove_id

    async def _bulk_stop_jobs(self, job_ids: list[str]):
        jobs_to_stop: set[JobContext] = set()
        procs_to_kill: list[SpawnProcess] = []
        monitor_tasks: list[asyncio.Task] = []

        # still on the main thread
        for job_id in job_ids:
            job = self._jobs.get(job_id)
            if job:
                jobs_to_stop.add(job)
                self._stopping_jobs.add(job_id)

        try:
            for job in jobs_to_stop:
                if not job.monitor_task.done():
                    job.monitor_task.cancel()
                    monitor_tasks.append(job.monitor_task)
                procs_to_kill.append(job.process)

            if monitor_tasks:
                try:
                    await asyncio.wait_for(
                        asyncio.gather(*monitor_tasks, return_exceptions=True),
                        timeout=1.0,
                    )
                except asyncio.TimeoutError:
                    logger.warning("[TASKMANAGER] Monitor task cancellation timeout")

            # kill on separate thread - avoid blocking main thread
            if procs_to_kill:
                await asyncio.to_thread(TrainingJobManager._kill_procs, procs_to_kill)
        finally:
            for job_id in job_ids:
                job = self._jobs.pop(job_id, None)
                if job is None or job.monitor_task.done():
                    self._stopping_jobs.discard(job_id)

    @staticmethod
    def _kill_procs(processes: list[SpawnProcess]):
        logger.info(
            f"[TASKMANAGER - KILL JOB STARTING] Killing {len(processes)} processes"
        )
        for proc in processes:
            try:
                try:
                    alive = proc.is_alive()
                except ValueError as e:
                    logger.debug(
                        f"[TASKMANAGER] Process already closed, skipping {proc.pid}: {e}"
                    )
                    continue

                if alive:
                    proc.terminate()
                    proc.join(timeout=1.0)
                    if proc.is_alive():
                        proc.kill()
                        proc.join(timeout=0.5)
                    if proc.is_alive():
                        logger.error(f"[TASKMANAGER] Failed to kill process {proc.pid}")
                        continue

                try:
                    proc.close()
                except ValueError as e:
                    logger.debug(
                        f"[TASKMANAGER] Process close failed for {proc.pid}: {e}"
                    )
            except Exception as e:
                logger.error(
                    f"[TASKMANAGER] Error during {proc.pid} process killing: {e}"
                )

    def _spawn_worker(
        self, job_id: str, payload: TrainWorkerRequest
    ) -> tuple[SpawnProcess, Connection]:
        ctx = get_context("spawn")
        parent_conn, child_conn = ctx.Pipe()
        p = ctx.Process(target=train_worker, args=(job_id, payload, child_conn))
        try:
            p.start()
        except Exception:
            try:
                parent_conn.close()
            except Exception as e:
                logger.warning(
                    f"[TASKMANAGER] Parent pipe close failed after start error: {e}"
                )
            try:
                child_conn.close()
            except Exception as e:
                logger.warning(
                    f"[TASKMANAGER] Child pipe close failed after start error: {e}"
                )
            raise
        child_conn.close()
        return p, cast(Connection, parent_conn)

    async def _monitor_process(
        self,
        job_id: str,
        process: SpawnProcess,
        conn: Connection,
        queue: asyncio.Queue,
        state: JobState,
        db_callback: Callable,
    ):
        logger.debug(f"[MONITOR] Started monitoring job {job_id}")
        state["status"] = "running"
        state["startedAt"] = datetime.now().isoformat()
        start_time = time.time()
        last_activity_time = time.time()

        def push_event(type: str, data: dict | JobState | None = None):
            if not queue.full():
                queue.put_nowait({"type": type, **(data or {})})

        try:
            while True:
                now = time.time()
                if now - start_time > MAX_JOB_DURATION_SEC:
                    raise TimeoutError(
                        f"Job exceeded max duration of {MAX_JOB_DURATION_SEC}s"
                    )
                if now - last_activity_time > MAX_IDLE_SEC:
                    raise TimeoutError(
                        f"Worker silent for {MAX_IDLE_SEC}s - assuming hang"
                    )

                has_data = conn.poll(0)

                if has_data:
                    msg = await asyncio.to_thread(conn.recv)
                    last_activity_time = time.time()
                    msg_type = msg.get("type")

                    if msg_type == "progress":
                        state["progress"] = float(msg.get("value", 0))
                        push_event("progress", {"progress": state["progress"]})
                    elif msg_type == "metric":
                        state["accuracy"] = float(msg.get("accuracy", 0))
                        state["loss"] = float(msg.get("loss", 1000))
                        push_event(
                            "metric",
                            {"accuracy": state["accuracy"], "loss": state["loss"]},
                        )
                    elif msg_type == "log":
                        level = msg.get("level", "info")
                        message = msg.get("message", "")
                        getattr(logger, level, logger.debug)(
                            f"[Worker {job_id}] {message}"
                        )  # trick to avoid if level == "info": logger.info()
                    elif msg_type == "done":
                        logger.info(f"Job {job_id} completed, updating database")
                        if not await db_callback(
                            msg.get("nn", {}), msg.get("meta", {})
                        ):
                            raise RuntimeError("Database update failed")
                        state.update(
                            {
                                "status": "done",
                                "progress": 1.0,
                                "accuracy": float(msg.get("accuracy", 0)),
                                "loss": float(msg.get("loss", 1000)),
                            }
                        )
                        push_event("done", state)
                        logger.info(f"Job {job_id} database update successful")
                        break
                    elif msg_type == "error":
                        raise RuntimeError(msg.get("message", "Unknown worker error"))
                    continue

                if not process.is_alive():
                    has_final = conn.poll(0)
                    if has_final:
                        continue
                    if state["status"] not in ("done", "error"):
                        raise RuntimeError("Process died unexpectedly")
                    break

                await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"Job {job_id} Error: {e}")
            state["status"] = "error"
            state["error"] = str(e)
            push_event("error", {"error": str(e)})
        finally:
            try:
                conn.close()
            except Exception as e:
                logger.warning(
                    f"[MONITOR] Failed to close connection for job {job_id}: {e}"
                )

            if job_id in self._stopping_jobs:
                logger.debug(
                    f"[MONITOR] Stop already requested for job {job_id}, _kill_procs will handle cleanup."
                )
            else:
                try:
                    if process.is_alive():
                        logger.info(
                            f"[MONITOR] Scheduling forced cleanup for process {job_id}"
                        )
                        asyncio.create_task(
                            asyncio.to_thread(TrainingJobManager._kill_procs, [process])
                        )
                    else:
                        process.close()
                except ValueError:
                    pass
                except Exception as e:
                    logger.warning(
                        f"[MONITOR] Process cleanup failed for job {job_id}: {e}"
                    )
            self._stopping_jobs.discard(job_id)


job_manager: TrainingJobManager = TrainingJobManager.get_instance()
