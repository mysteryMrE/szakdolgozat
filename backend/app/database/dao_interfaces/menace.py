from abc import ABC, abstractmethod
from app.schemas.db_rows import MenaceDbRow


class MenaceDao(ABC):

    @abstractmethod
    async def insert_menace(
        self, menace_id: str, user_id: str, name: str, matchboxes: dict, meta: dict
    ) -> None: ...

    @abstractmethod
    async def get_menace(self, menace_id: str) -> MenaceDbRow | None: ...

    @abstractmethod
    async def update_menace_matchboxes(
        self, menace_id: str, matchboxes: dict
    ) -> None: ...

    @abstractmethod
    async def update_menace_meta(self, menace_id: str, meta: dict) -> None: ...

    @abstractmethod
    async def list_menace_for_user(self, user_id: str) -> list[MenaceDbRow]: ...

    @abstractmethod
    async def delete_menace(self, menace_id: str, user_id: str) -> None: ...
