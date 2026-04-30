import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.managers.periodic_tasks import PeriodicTaskManager


@pytest.fixture
def manager():
    PeriodicTaskManager.reset_instance()
    yield PeriodicTaskManager()


class TestPeriodicTaskManager:

    async def test_register_start_and_stop(self, manager):
        cleanable = MagicMock()
        cleanable.partial_cleanup = AsyncMock()

        manager.register("session-prune", cleanable, interval_seconds=3600)

        async def idle_runner(*args, **kwargs):
            await asyncio.sleep(60)

        manager._run_periodic = idle_runner
        manager.start()
        await asyncio.sleep(0.01)

        assert len(manager._tasks) == 1
        task = manager._tasks[0]
        assert not task.done()

        await manager.stop()

        assert manager._tasks == []
        assert task.cancelled()

    async def test_run_periodic_invokes_cleanup(self):
        calls = 0

        async def cleanup_callable():
            nonlocal calls
            calls += 1

        task = asyncio.create_task(
            PeriodicTaskManager._run_periodic("job", 0, cleanup_callable)
        )

        await asyncio.sleep(0.01)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

        assert calls > 0

    async def test_run_periodic_handles_unexpected_exception(self):
        calls = 0

        async def failing_cleanup():
            nonlocal calls
            calls += 1
            raise RuntimeError("o-o")

        await PeriodicTaskManager._run_periodic("job", 0, failing_cleanup)
        assert calls == 1

    async def test_stop_with_no_tasks(self, manager):
        await manager.stop()
        assert manager._tasks == []

    async def test_stop_handles_timeout(self, manager, monkeypatch):

        async def long_running():
            await asyncio.sleep(60)

        task = asyncio.create_task(long_running())
        await asyncio.sleep(0.01)
        manager._tasks = [task]

        async def raise_timeout(*args, **kwargs):
            raise asyncio.TimeoutError()

        monkeypatch.setattr(
            "app.services.managers.periodic_tasks.asyncio.wait_for", raise_timeout
        )
        await manager.stop()
        assert manager._tasks == []
