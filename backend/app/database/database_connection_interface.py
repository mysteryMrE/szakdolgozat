from abc import ABC, abstractmethod


class DatabaseConnection(ABC):
    """Interface for database connection lifecycle operations."""

    @abstractmethod
    async def open(self) -> None: ...

    @abstractmethod
    async def close(self) -> None: ...

    @abstractmethod
    async def create_database_tables(self) -> None: ...

    @abstractmethod
    async def check_connection(self) -> bool: ...

    @abstractmethod
    async def drop_schema(self) -> None: ...
