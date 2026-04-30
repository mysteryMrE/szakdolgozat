from abc import ABC, abstractmethod
from datetime import datetime
from app.schemas.db_rows import SessionDbRow


class SessionDao(ABC):

    @abstractmethod
    async def revoke_sessions_for_user(self, user_id: str) -> None: ...

    @abstractmethod
    async def insert_session(
        self, session_id: str, user_id: str, refresh_hash: str
    ) -> None: ...

    @abstractmethod
    async def get_session(self, session_id: str) -> SessionDbRow | None: ...

    @abstractmethod
    async def get_session_for_user(self, user_id: str) -> SessionDbRow | None: ...

    @abstractmethod
    async def update_session_refresh(
        self, session_id: str, refresh_hash: str
    ) -> None: ...

    @abstractmethod
    async def revoke_session(self, session_id: str) -> None: ...

    @abstractmethod
    async def touch_session(self, session_id: str) -> None: ...

    @abstractmethod
    async def prune_expired_sessions(self, cutoff_time: datetime) -> int: ...
