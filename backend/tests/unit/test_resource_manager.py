from app.services.managers.resource_manager import ResourceManager
import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest


@pytest.fixture
def manager():
    ResourceManager.reset_instance()
    yield ResourceManager()


class TestResourceManager:

    def test_get_semaphore_strict_raises_before_start(self, manager: ResourceManager):
        with pytest.raises(RuntimeError, match="ResourceManager not started"):
            manager.get_semaphore_strict()

    def test_start_initializes_pool_and_semaphore(
        self, manager: ResourceManager, monkeypatch
    ):

        dummy_pool = MagicMock()
        context = MagicMock()
        executor = MagicMock(return_value=dummy_pool)
        get_context = MagicMock(return_value=context)

        monkeypatch.setattr(
            "app.services.managers.resource_manager.ProcessPoolExecutor", executor
        )
        monkeypatch.setattr(
            "app.services.managers.resource_manager.multiprocessing.get_context",
            get_context,
        )
        monkeypatch.setattr(
            "app.services.managers.resource_manager.config.get_cpu_count", lambda: 8
        )
        monkeypatch.setattr(
            "app.services.managers.resource_manager.config.get_training_process_count",
            lambda: 3,
        )
        monkeypatch.setattr(
            "app.services.managers.resource_manager.config.get_resource_over_provision",
            lambda: 2,
        )

        manager.start()

        assert manager.process_pool is dummy_pool
        assert manager.semaphore is not None
        assert manager.semaphore._value == (8 - 3) * 2
        get_context.assert_called_once_with("spawn")
        executor.assert_called_once_with(max_workers=(8 - 3), mp_context=context)

    async def test_run_blocking_task_uses_to_thread(
        self, manager: ResourceManager, monkeypatch
    ):
        manager.semaphore = asyncio.Semaphore(1)

        async_to_thread = AsyncMock(return_value=42)
        monkeypatch.setattr(
            "app.services.managers.resource_manager.asyncio.to_thread", async_to_thread
        )

        result = await manager.run_blocking_task(sum, [60, 7])
        async_to_thread.assert_awaited_once_with(sum, [60, 7])
        assert result == 42

    def test_shutdown_stops_pool(self, manager: ResourceManager):
        fake_pool = MagicMock()
        manager.process_pool = fake_pool

        manager.shutdown()

        fake_pool.shutdown.assert_called_once_with(wait=False, cancel_futures=True)
        assert manager.process_pool is None
        assert manager.semaphore is None

    def test_start_when_already_started(self, manager: ResourceManager, monkeypatch):
        manager.process_pool = MagicMock()

        cpu_count = MagicMock(return_value=8)
        monkeypatch.setattr(
            "app.services.managers.resource_manager.config.get_cpu_count", cpu_count
        )

        manager.start()
        cpu_count.assert_not_called()
