from abc import ABC, abstractmethod
from .database_config_interface import DatabaseConfig
from .database_gateway_interface import DatabaseGateway
from typing import TypeVar, Generic

Tc = TypeVar("Tc", bound=DatabaseConfig)
Tg = TypeVar("Tg", bound=DatabaseGateway)


class DatabaseFactory(ABC, Generic[Tc, Tg]):
    """Interface for database factories."""

    @abstractmethod
    def create_config(self) -> Tc: ...

    @abstractmethod
    def create_database_gateway(self, config: Tc) -> Tg: ...

    @abstractmethod
    def get_database_name(self) -> str: ...

    @abstractmethod
    def get_supported_names(self) -> list[str]: ...

    @abstractmethod
    def supports_database(self, database_name: str) -> bool: ...
