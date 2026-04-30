from sqlalchemy import select
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
)
from contextlib import asynccontextmanager
import asyncio
from app.core.logger import AppLogger

logger = AppLogger(__name__)


"""
Credits: https://medium.com/@tclaitken/setting-up-a-fastapi-app-with-async-sqlalchemy-2-0-pydantic-v2-e6c540be4308
"""


class AsyncSessionFactory:
    """
    Factory for creating async sessions with connection pooling.
    """

    def __init__(
        self,
        database_url: str,
        pool_size: int = 10,
        max_overflow: int = 10,
        pool_timeout: float = 10.0,
        pool_recycle: int = 1800,
        echo: bool = False,
    ):
        """
        Initialize the session factory with connection pooling.

        Args:
            database_url: PostgreSQL connection URL
            pool_size: Number of connections to keep open in the pool
            max_overflow: Maximum extra connections beyond pool_size
            pool_timeout: Seconds to wait for a connection from pool
            pool_recycle: Seconds after which connections are recycled
            echo: If True, log all SQL statements
        """
        logger.info(
            f"[DATABASE] Creating async engine with pool_size={pool_size}, max_overflow={max_overflow}"
        )
        logger.info(f"[DATABASE] Database URL: {database_url}")
        self._engine = create_async_engine(
            database_url,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_timeout=pool_timeout,
            pool_recycle=pool_recycle,
            echo=echo,
            connect_args={"command_timeout": 5},
        )

        self._session_factory = async_sessionmaker(bind=self._engine)

        logger.info("[DATABASE] Async engine created")

    async def close(self) -> None:
        """
        Close the engine and all pooled connections.
        """
        if self._engine is not None:
            logger.info("[DATABASE] Closing async engine...")
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None
            logger.info("[DATABASE] Async engine closed")

    @asynccontextmanager
    async def get_session(self):
        """
        Get an async session from the pool.

        The session is automatically committed on success and rolled back on error.
        """
        if self._session_factory is None:
            raise RuntimeError("Session factory is not initialized or has been closed.")
        async with self._session_factory() as session:
            async with session.begin():
                yield session

    @asynccontextmanager
    async def get_connection(self):
        """Get a transactional connection context from the engine."""
        if self._engine is None:
            raise RuntimeError("Engine is not initialized or has been closed.")
        async with self._engine.begin() as conn:
            yield conn

    async def check_connection(self) -> bool:
        """
        Check if the database connection is working.

        Returns:
            True if connection successful, False otherwise
        """
        if self._engine is None:
            raise RuntimeError("Engine is not initialized or has been closed.")
        try:
            async with asyncio.timeout(2):
                async with self._engine.connect() as conn:
                    await conn.execute(select(1))
            return True
        except asyncio.TimeoutError:
            logger.info("[DATABASE] Connection check timed out")
            return False
        except Exception as e:
            logger.info(f"[DATABASE] Connection check failed: {e}")
            return False
