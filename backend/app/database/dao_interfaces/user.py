from abc import ABC, abstractmethod
from app.schemas.db_rows import UserDbRow


class UserDao(ABC):

    @abstractmethod
    async def create_user(
        self, user_id: str, user_name: str, password_hash: str
    ) -> None: ...

    @abstractmethod
    async def update_user(
        self, user_id: str, user_name: str, password_hash: str
    ) -> None: ...

    @abstractmethod
    async def delete_user(self, user_id: str) -> None: ...

    @abstractmethod
    async def get_user_by_id(self, user_id: str) -> UserDbRow | None: ...

    @abstractmethod
    async def get_user_by_name(self, user_name: str) -> UserDbRow | None: ...

    @abstractmethod
    async def get_user_by_name_lower(
        self, user_name_lower: str
    ) -> UserDbRow | None: ...
