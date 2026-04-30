from fastapi import APIRouter, Request, status, HTTPException
import time
from app.schemas import HealthResponse, DBHealthResponse, InfoResponse, RootResponse
from app.core.dependencies import (
    ConfDep,
    ConnectionDBDep,
    BotTaskManagerDep,
    GameManagerDep,
    TrainJobManagerDep,
    WebSocketManagerDep,
    rate_limiter,
)
from app.game.players import MinimaxPlayer

router = APIRouter()

start_time = time.time()


@router.get("/debug-ip")
async def debug_ip(request: Request):
    client_host = request.client.host if request.client else None

    return {
        "client_host": client_host,
        "x_forwarded_for": request.headers.get("x-forwarded-for"),
        "headers": request.headers,
    }


@router.get("/health", response_model=HealthResponse)
@rate_limiter("20/minute")
async def health_check(request: Request):
    """Simple health check endpoint"""
    return {"status": "ok"}


@router.get("/db_health", response_model=DBHealthResponse)
@rate_limiter("20/minute")
async def db_health_check(request: Request, db: ConnectionDBDep):
    """Database health check endpoint"""
    db_ok = await db.check_connection()
    if not db_ok:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unresponsive"
        )
    return {"status": "ok"}


@router.get("/", response_model=RootResponse)
@rate_limiter("20/minute")
async def root(request: Request):
    """Root endpoint providing welcome message"""
    return {"message": "Welcome to MyApp API"}


@router.get("/info", response_model=InfoResponse)
@rate_limiter("20/minute")
async def info(request: Request, config: ConfDep):
    """Provides application information including name, version, and uptime."""
    uptime = round(time.time() - start_time, 2)
    return {
        "app": config.get_project_name(),
        "version": config.get_version(),
        "uptime_seconds": uptime,
    }


# should be exisiting for soak testing
# @router.get("/stats")
# async def stats(
#     request: Request,
#     job_manager: TrainJobManagerDep,
#     bot_manager: BotTaskManagerDep,
#     ws_manager: WebSocketManagerDep,
#     game_manager: GameManagerDep,
# ):
#     return {
#         "active_jobs": job_manager.active_count(),
#         "jobs": len(job_manager._jobs),
#         "bots": len(bot_manager._tasks),
#         "games": len(game_manager.active_sessions),
#         "last_seen": len(game_manager.game_last_seen),
#         "websocket active": len(ws_manager.active_sockets),
#         "websocket users": len(ws_manager.active_users),
#         "websocket locks": len(ws_manager.send_locks),
#         "guest ip counts": len(ws_manager._guest_ip_counts),
#         "guest ws to ip": len(ws_manager._guest_ws_to_ip),
#         "minimax_cache": len(MinimaxPlayer._move_cache),
#     }
