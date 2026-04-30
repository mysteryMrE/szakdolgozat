from abc import ABC, abstractmethod
from app.schemas.db_rows import NetworkDbRow


class NetworkDao(ABC):

    @abstractmethod
    async def insert_network(
        self, network_id: str, user_id: str, name: str, nn: dict, meta: dict
    ) -> NetworkDbRow: ...

    @abstractmethod
    async def update_network(
        self,
        network_id: str,
        name: str | None = None,
        nn: dict | None = None,
        meta: dict | None = None,
    ) -> NetworkDbRow | None: ...

    @abstractmethod
    async def delete_network(self, network_id: str, user_id: str) -> None: ...

    @abstractmethod
    async def list_networks_for_user(
        self, user_id: str, limit: int
    ) -> list[NetworkDbRow]: ...

    @abstractmethod
    async def count_networks_for_user(self, user_id: str) -> int: ...

    @abstractmethod
    async def get_network_by_id_user(
        self, network_id: str, user_id: str
    ) -> NetworkDbRow | None: ...

    @abstractmethod
    async def get_network_by_id(self, network_id: str) -> NetworkDbRow | None: ...
