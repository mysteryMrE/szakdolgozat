from app.services.singleton import Singleton
from .database_factory_registry import DatabaseFactoryRegistry
from .database_gateway_interface import DatabaseGateway
from .database_factory_interface import DatabaseFactory
from app.core.logger import AppLogger
from app.core.config import config

logger = AppLogger(__name__)


class DatabaseManager(metaclass=Singleton):
    """
    Singleton class to manage database connections.

    Creates database gateway based on environment configuration, and provides access to it.
    Uses DatabaseFactoryRegistry to support multiple databases.
    """

    def __init__(self) -> None:
        self._registry = DatabaseFactoryRegistry()
        self._setup_database()

    def _setup_database(self):
        backend = config.get_db_backend().lower()
        self._gateway = self._registry.create_database_gateway(backend)

    def get_database(self) -> DatabaseGateway:
        return self._gateway

    def register_custom_factory(self, factory: DatabaseFactory) -> None:
        self._registry.register_factory(factory)

    def get_supported_backends(self) -> list[str]:
        return self._registry.get_supported_backends()

    async def create_database_tables(self) -> None:
        """Create the database tables."""
        await self._gateway.open()
        await self._gateway.create_database_tables()

    async def drop_schema(self) -> None:
        """Drop the database schema."""
        await self._gateway.drop_schema()

    async def check_connection(self) -> bool:
        """
        Checks if the database connection can be established.

        Returns:
            bool: True if connection is successful, False otherwise
        """
        logger.info("[DATABASE] Checking database connection...")
        result = await self._gateway.check_connection()
        if result:
            logger.info("[DATABASE] Database connection successful.")
        else:
            logger.info("[DATABASE] Database connection failed.")
        return result

    async def close(self) -> None:
        """
        Close the database connection pool.
        """
        logger.info("[DATABASE] Closing database connections...")
        await self._gateway.close()
        logger.info("[DATABASE] Database connections closed.")


class _LazyDbManager:

    def __getattr__(self, name: str):
        return getattr(DatabaseManager.get_instance(), name)


db_manager: DatabaseManager = _LazyDbManager()  # type: ignore
