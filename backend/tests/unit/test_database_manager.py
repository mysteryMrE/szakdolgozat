import asyncio
from unittest.mock import AsyncMock, MagicMock
import pytest
from app.database.database_manager import DatabaseManager, db_manager


@pytest.fixture()
def setup_database_mocks(monkeypatch):
    mock_gateway = MagicMock()
    mock_factory = MagicMock()
    mock_factory.get_supported_names = MagicMock(return_value=["postgres"])
    mock_registry = DummyRegistry(mock_gateway)
    mock_registry.register_factory(mock_factory)
    monkeypatch.setattr(
        "app.database.database_manager.DatabaseFactoryRegistry", lambda: mock_registry
    )
    monkeypatch.setattr(
        "app.database.database_manager.config.get_db_backend", lambda: "PostgRes"
    )

    DatabaseManager.reset_instance()
    mock_manager = DatabaseManager.get_instance()

    yield mock_manager, mock_registry, mock_gateway, mock_factory


class DummyRegistry:

    def __init__(self, gateway):
        self.gateway = gateway
        self.factories = []
        self.created = []

    def create_database_gateway(self, backend):
        self.created.append(backend)
        return self.gateway

    def register_factory(self, factory):
        self.factories.append(factory)

    def get_supported_backends(self):
        backends = []
        for factory in self.factories:
            backends.extend(factory.get_supported_names())
        return backends


class TestDatabaseManager:

    def test_setup_uses_lowercased_backend(self, setup_database_mocks):
        manager, registry, gateway, _ = setup_database_mocks

        assert manager.get_database() is gateway
        assert registry.created == ["postgres"]

    async def test_gateway_delegation_methods(self, setup_database_mocks):
        manager, _, gateway, _ = setup_database_mocks

        gateway.open = AsyncMock()
        gateway.create_database_tables = AsyncMock()
        gateway.drop_schema = AsyncMock()
        gateway.check_connection = AsyncMock(return_value=True)
        gateway.close = AsyncMock()

        await manager.create_database_tables()
        gateway.open.assert_awaited_once()
        gateway.create_database_tables.assert_awaited_once()

        await manager.drop_schema()
        gateway.drop_schema.assert_awaited_once()

        assert await manager.check_connection() is True
        gateway.check_connection.assert_awaited_once()

        await manager.close()
        gateway.close.assert_awaited_once()

    def test_register_and_supported_backends_delegate_to_registry(
        self, setup_database_mocks
    ):
        manager, registry, _, mock_factory = setup_database_mocks

        fake_factory = MagicMock()
        fake_factory.get_supported_names = MagicMock(return_value=["fake"])

        manager.register_custom_factory(fake_factory)
        supported = manager.get_supported_backends()

        assert registry.factories == [mock_factory, fake_factory]
        assert supported == ["postgres", "fake"]
