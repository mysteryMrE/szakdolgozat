import asyncio
from typing import Coroutine
from app.core.logger import AppLogger
from app.services.singleton import Singleton

logger = AppLogger(__name__)


class BotTaskManager(metaclass=Singleton):
    """
    Singleton class that manages background tasks for bots.
    """

    def __init__(self):
        self._tasks: dict[str, asyncio.Task] = {}

    def cancel_task(self, user_id: str):
        """Stops any running bot task for this user."""
        if user_id in self._tasks:
            task = self._tasks[user_id]
            if not task.done():
                task.cancel()
                logger.debug(f"Cancelled background task for user {user_id}")
            self._tasks.pop(user_id, None)

    def start_task(self, user_id: str, coroutine: Coroutine):
        """Cancels old task (if any) and starts a new one."""
        self.cancel_task(user_id)
        task = asyncio.create_task(coroutine)
        self._tasks[user_id] = task
        task.add_done_callback(lambda task: self._cleanup_task(user_id, task))

        return task

    def _cleanup_task(self, user_id: str, task: asyncio.Task):
        """Removes the task from the dict only if it matches the current task."""
        logger.debug(f"Cleanup task callback for user {user_id}")
        if self._tasks.get(user_id) == task:
            self._tasks.pop(user_id, None)
            logger.debug(f"Popped background task for user {user_id}")

    async def full_cleanup(self):
        logger.info(
            f"[CLEANUP] BotTaskManager full cleanup initiated ({len(self._tasks)} tasks)"
        )
        tasks_dict = self._tasks.copy()
        self._tasks.clear()

        if not tasks_dict:
            return

        for _, task in tasks_dict.items():
            if not task.done():
                task.cancel()

        await asyncio.gather(*tasks_dict.values(), return_exceptions=True)


bot_manager: BotTaskManager = BotTaskManager.get_instance()
