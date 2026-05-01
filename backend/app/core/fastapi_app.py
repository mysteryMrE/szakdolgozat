from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
from .config import config, AppConfig
from app.middlewares.cors_middleware import CorsMiddleWare
from app.middlewares.trusted_host_middleware import TrustedHostMiddleWare
from app.routers import (
    system_router,
    user_router,
    network_router,
    job_router,
    game_router,
)
from app.database.database_manager import db_manager
from app.services.default_player_maker import DefaultPlayerMaker
from app.services.managers.websocket_manager import ws_manager
from app.services.managers.train_job_manager import job_manager
from app.services.managers.game_manager import game_manager
from app.services.managers.bot_task_manager import bot_manager
from app.core.logger import AppLogger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .dependencies import limiter, get_db, get_authenticator
from app.middlewares.proxy_middleware import ProxyMiddleWare
from app.middlewares.logger_middleware import LoggerMiddleware
from app.middlewares.auth_middleware import AuthMiddleware
from ..services.managers.resource_manager import resources
from app.services.session_pruning_service import SessionPruningService
from app.services.managers.periodic_tasks import PeriodicTaskManager

logger = AppLogger(__name__)


class FastAPIApp:
    """
    Encapsulates FastAPI application setup and lifecycle management.

    Handles startup initialization, router, middleware and database setup,
    default player creation and shutdown cleanup.
    """

    def __init__(self, config: AppConfig):

        @asynccontextmanager
        async def lifespan(app: FastAPI):
            logger.info("[STARTUP] Lifespan context starting")
            resources.start()
            await self._init_async_components(config)
            logger.info("[STARTUP] Lifespan yield")
            yield
            logger.info("[SHUTDOWN] Lifespan context exiting")
            await self._shutdown_cleanup()

        self._app = FastAPI(
            title=config.get_project_name(),
            version=config.get_version(),
            lifespan=lifespan,
        )
        self._app.state.limiter = limiter
        self._app.add_exception_handler(
            RateLimitExceeded, _rate_limit_exceeded_handler  # type: ignore
        )
        logger.info("[SETUP] Setting up routers and middleware")
        self._setup_routers()
        self._setup_middleware(config)
        self._periodic_task_manager: PeriodicTaskManager = (
            PeriodicTaskManager.get_instance()
        )
        self._periodic_task_manager.register("job_cleanup", job_manager, 240)
        self._periodic_task_manager.register("game_cleanup", game_manager, 180)

        logger.info("[SETUP] FastAPI application setup complete")

    async def _init_async_components(self, config: AppConfig):

        db_ok = await db_manager.check_connection()

        if db_ok:
            await db_manager.create_database_tables()
            await self._register_admin(config.get_admin_password())
            self._periodic_task_manager.register(
                "session_pruning",
                SessionPruningService(get_db(), get_authenticator()),
                600,
            )

        if not config.get_disable_training() and db_ok:
            pop_size = config.get_genetic_pop_total()
            gen_count = config.get_genetic_generations()
            exploration = config.get_menace_exploration()
            exploitation = config.get_menace_exploitation()
            epochs = config.get_backprop_epochs()
            await DefaultPlayerMaker.create_menace(
                exploration=exploration, exploitation=exploitation
            )  # suggested 5000, 100000
            await DefaultPlayerMaker.create_backprop_nn(epochs=epochs)  # suggested 5000
            await DefaultPlayerMaker.create_genetic_nn(
                population_size=pop_size, generations=gen_count
            )  # suggested 180, 200
        else:
            logger.info("[STARTUP] Skipping default player training")

        if not config.get_disable_periodic_tasks():
            self._periodic_task_manager.start()
        else:
            logger.info("[STARTUP] Skipping periodic background tasks")

    def _setup_routers(self):
        self._app.include_router(system_router, prefix="", tags=["System"])
        self._app.include_router(user_router, prefix="/users", tags=["Users"])
        self._app.include_router(network_router, prefix="/networks", tags=["Networks"])
        self._app.include_router(job_router, prefix="/jobs", tags=["Jobs"])
        self._app.include_router(game_router, prefix="/game", tags=["Game"])

    def _setup_middleware(self, config: AppConfig):
        # onion form - last registered is the outermost, the first to handle requests and the last to handle responses
        trusted = TrustedHostMiddleWare(
            allowed_hosts=config.get_allowed_hostnames(),
        )
        trusted.register(self._app)

        self._app.add_middleware(AuthMiddleware, auth=get_authenticator())

        proxy = ProxyMiddleWare(
            trusted_hosts=config.get_trusted_proxies(),
        )
        proxy.register(self._app)

        cors = CorsMiddleWare(
            allow_origins=config.get_cors_origins(),
            allow_credentials=config.get_cors_credentials(),
            allow_methods=config.get_cors_methods(),
            allow_headers=config.get_cors_headers(),
        )

        cors.register(self._app)
        self._app.add_middleware(LoggerMiddleware)

    async def _register_admin(self, admin_password: str):
        db_dao = get_db()
        auth = get_authenticator()
        pw = admin_password
        hashed_pw = auth.hash_password(pw)
        try:
            admin_exists = await db_dao.get_user_by_name("admin")
            if admin_exists:
                logger.info("[STARTUP] Admin user already exists, skipping creation")
                return
            await db_dao.create_user("admin", "admin", hashed_pw)
        except Exception as e:
            logger.error(f"[ERROR] Admin user creation failed: {e}")

    async def _shutdown_cleanup(self):
        logger.info("[SHUTDOWN] Starting cleanup")

        all_tasks = asyncio.all_tasks()
        logger.info(f"[SHUTDOWN] Total asyncio tasks running: {len(all_tasks)}")
        for task in all_tasks:
            if not task.done():
                logger.info(
                    f"[SHUTDOWN] Active task: {task.get_name()} - {task.get_coro()}"
                )

        await self._periodic_task_manager.stop()

        logger.info(
            "[SHUTDOWN] Running cleanup jobs and websocket cleanup and resource manager shutdown..."
        )

        cleanup_tasks = [
            job_manager.full_cleanup(),
            ws_manager.full_cleanup(),
            bot_manager.full_cleanup(),
        ]

        try:
            results = await asyncio.wait_for(
                asyncio.gather(*cleanup_tasks, return_exceptions=True), timeout=5.0
            )
            logger.info(f"[SHUTDOWN] Cleanup tasks completed: {results}")
        except asyncio.TimeoutError:
            logger.warning("[SHUTDOWN] Cleanup timeout - forcing exit")

        try:
            resources.shutdown()
        except Exception as e:
            logger.error(f"[SHUTDOWN] Error shutting down process pool: {e}")

        logger.info("[SHUTDOWN] Closing database connections...")
        try:
            await db_manager.close()
        except Exception as e:
            logger.error(f"[SHUTDOWN] Error closing database: {e}")
        logger.info("[SHUTDOWN] Cleanup completed")

    def get_app(self):
        return self._app


def create_app() -> FastAPI:
    """
    Factory function to create FastAPI application.
    Initializes configuration, logging, and application instance.

    This function is used with --factory option of Uvicorn.
    This way the async initialization can be handled properly.

    Returns:
        FastAPI: Instance of the application
    """
    AppLogger.setup(
        log_file=config.get_log_file(),
        console_level=config.get_console_log_level(),
        file_level=config.get_file_log_level(),
    )

    application = FastAPIApp(config=config)
    return application.get_app()
