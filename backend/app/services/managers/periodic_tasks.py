import asyncio
from typing import Any, Awaitable, Callable
from app.contracts.cleanup_contract import PartialCleanable
from app.core.logger import AppLogger
from ..singleton import Singleton

logger = AppLogger(__name__)


class PeriodicTaskManager(metaclass=Singleton):

    def __init__(self):
        self._cleanups: dict[str, tuple[PartialCleanable, int]] = {}
        self._tasks: list[asyncio.Task] = []

    def register(
        self,
        name: str,
        cleanable: PartialCleanable,
        interval_seconds: int,
    ) -> None:
        """
        Register a periodic cleanup service.

        Args:
            name: Unique identifier for logging/debugging
            cleanable: Service implementing partial_cleanup()
            interval_seconds: How often to invoke cleanup
        """
        self._cleanups[name] = (cleanable, interval_seconds)
        logger.debug(
            f"[PERIODIC] Registered cleanup: {name} (interval={interval_seconds}s)"
        )

    @staticmethod
    async def _run_periodic(
        name: str,
        interval_seconds: int,
        cleanup_callable: Callable[[], Awaitable[Any]],
    ):
        try:
            while True:
                await asyncio.sleep(interval_seconds)
                await cleanup_callable()
                logger.info(f"[PERIODIC] Completed {name} cleanup")

        except asyncio.CancelledError:
            logger.info(f"[PERIODIC] {name} task cancelled")

            raise
        except Exception as e:
            logger.error(f"[PERIODIC] Unexpected error in {name}: {e}")

    def start(self) -> None:
        """Start all registered periodic cleanup tasks."""
        for name, (cleanable, interval) in self._cleanups.items():
            self._tasks.append(
                asyncio.create_task(
                    self._run_periodic(name, interval, cleanable.partial_cleanup)
                )
            )
        logger.info(
            f"[STARTUP] Periodic background tasks started ({len(self._cleanups)} registered)"
        )

    async def stop(self) -> None:
        """Cancel all periodic tasks gracefully."""
        if not self._tasks:
            return

        logger.info("[SHUTDOWN] Cancelling periodic tasks")
        tasks_to_cancel: list[asyncio.Task] = []
        for task in self._tasks:
            if not task.done():
                task.cancel()
                tasks_to_cancel.append(task)

        if tasks_to_cancel:
            try:
                await asyncio.wait_for(
                    asyncio.gather(*tasks_to_cancel, return_exceptions=True),
                    timeout=2.0,
                )
                logger.info("[SHUTDOWN] Periodic tasks cancelled successfully")
            except asyncio.TimeoutError:
                unfinished = [t for t in tasks_to_cancel if not t.done()]
                logger.warning(
                    f"[SHUTDOWN] {len(unfinished)} periodic tasks did not cancel in time"
                )

        self._tasks.clear()
