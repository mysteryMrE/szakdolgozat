from abc import ABC, abstractmethod
from typing import Any
from app.schemas.db_rows import EvoNetworkDbRow


class EvolutionDao(ABC):

    @abstractmethod
    async def get_evolution_network_by_id(
        self, network_id: str
    ) -> EvoNetworkDbRow | None: ...

    @abstractmethod
    async def get_evolution_network_by_id_user(
        self, network_id: str, user_id: str
    ) -> EvoNetworkDbRow | None: ...

    @abstractmethod
    async def insert_evolution_network(
        self,
        network_id: str,
        user_id: str,
        nn: dict[str, Any],
        meta: dict[str, Any] | None = None,
    ) -> None: ...

    @abstractmethod
    async def update_evolution_network(
        self,
        network_id: str,
        nn: dict[str, Any] | None = None,
        meta: dict[str, Any] | None = None,
    ) -> None: ...

    @abstractmethod
    async def delete_evolution_network(self, network_id: str) -> None: ...
