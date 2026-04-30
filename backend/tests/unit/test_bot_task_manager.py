import asyncio
from unittest.mock import MagicMock


class TestBotTaskManager:

    async def test_start_task_replaces_existing_task(self, bot_manager):

        async def wait_long():
            try:
                await asyncio.sleep(60)
            except asyncio.CancelledError:
                raise

        old_task = bot_manager.start_task("user-1", wait_long())
        await asyncio.sleep(0.001)
        assert bot_manager._tasks["user-1"] is old_task

        async def short_running():
            try:
                return await asyncio.sleep(0.1, result="done sleeping")
            except asyncio.CancelledError:
                raise

        new_task = bot_manager.start_task("user-1", short_running())
        await asyncio.sleep(0.001)

        assert old_task.cancelled()
        assert bot_manager._tasks["user-1"] is new_task
        assert await new_task == "done sleeping"

    def test_cleanup_task_only_removes_matching_task(self, bot_manager):
        current_task = MagicMock()
        stale_task = MagicMock()
        bot_manager._tasks["user-1"] = current_task

        bot_manager._cleanup_task("user-1", stale_task)
        assert bot_manager._tasks["user-1"] is current_task

        bot_manager._cleanup_task("user-1", current_task)
        assert "user-1" not in bot_manager._tasks

    async def test_full_cleanup_cancels_and_clears_tasks(self, bot_manager):

        async def wait_long():
            try:
                await asyncio.sleep(60)
            except asyncio.CancelledError:
                raise

        task_a = bot_manager.start_task("user-a", wait_long())
        await asyncio.sleep(0.001)
        task_b = bot_manager.start_task("user-b", wait_long())
        await asyncio.sleep(0.001)
        assert not task_a.done()
        assert not task_b.done()

        await bot_manager.full_cleanup()

        assert bot_manager._tasks == {}
        assert task_a.cancelled()
        assert task_b.cancelled()

    async def test_full_cleanup_with_no_tasks(self, bot_manager):
        await bot_manager.full_cleanup()
        assert bot_manager._tasks == {}
