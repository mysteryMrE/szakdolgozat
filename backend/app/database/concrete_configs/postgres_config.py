from ..database_config_interface import DatabaseConfig
from functools import cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PostgreSQLConfig(BaseSettings, DatabaseConfig):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    host: str = Field(default="localhost", validation_alias="postgres_host")
    port: str = Field(default="5432", validation_alias="postgres_port")
    user: str = Field(default="postgres", validation_alias="postgres_user")
    password: str = Field(default="postgres", validation_alias="postgres_password")
    db: str = Field(default="postgres", validation_alias="postgres_db")
    dsn_override: str | None = Field(default=None, validation_alias="db_dsn")

    pool_size: int = Field(default=10, validation_alias="db_pool_size")
    max_overflow: int = Field(default=10, validation_alias="db_max_overflow")
    pool_timeout: float = Field(default=30.0, validation_alias="db_pool_timeout")
    pool_recycle: int = Field(default=1800, validation_alias="db_pool_recycle")
    echo_sql: bool = Field(default=False, validation_alias="db_echo_sql")

    def build_dsn(self) -> str:
        if self.dsn_override:
            dsn = self.dsn_override
            if dsn.startswith("postgresql://"):
                return dsn.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif dsn.startswith("postgres://"):
                return dsn.replace("postgres://", "postgresql+asyncpg://", 1)
            return dsn

        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.db}"


@cache
def get_postgres_config() -> PostgreSQLConfig:
    return PostgreSQLConfig()


# cache vs lru_cache
# as this function takes no parameters, the cache will stay 1 sized, not like a factorial or similar fucntion
