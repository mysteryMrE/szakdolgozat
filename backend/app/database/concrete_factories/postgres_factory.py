from ..database_factory_interface import DatabaseFactory
from ..concrete_configs.postgres_config import (
    PostgreSQLConfig,
    get_postgres_config,
)
from ..gateways import PostgreSQLGateway
from ..session_factory import AsyncSessionFactory
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class PostgreSQLFactory(DatabaseFactory[PostgreSQLConfig, PostgreSQLGateway]):

    def get_database_name(self) -> str:
        return "postgresql"

    def get_supported_names(self) -> list[str]:
        return ["postgres", "postgresql"]

    def create_config(self) -> PostgreSQLConfig:
        return get_postgres_config()

    def create_database_gateway(self, config: PostgreSQLConfig) -> PostgreSQLGateway:
        logger.info(f"Creating {self.get_database_name()} database gateway.")

        session_factory = AsyncSessionFactory(
            database_url=config.build_dsn(),
            pool_size=config.pool_size,
            max_overflow=config.max_overflow,
            pool_timeout=config.pool_timeout,
            pool_recycle=config.pool_recycle,
            echo=config.echo_sql,
        )

        return PostgreSQLGateway(session_factory)

    def supports_database(self, database_name: str) -> bool:
        return database_name.lower() in self.get_supported_names()
