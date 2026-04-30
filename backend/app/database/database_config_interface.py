from abc import ABC, abstractmethod


class DatabaseConfig(ABC):
    """Interface for database configuration."""

    @abstractmethod
    def build_dsn(self) -> str: ...
