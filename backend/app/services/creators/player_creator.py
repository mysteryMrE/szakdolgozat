from abc import ABC, abstractmethod

from app.game.player import Player


class PlayerCreator(ABC):

    @abstractmethod
    async def create(
        self,
        player_id: str | None = None,
        player_name: str | None = None,
    ) -> Player | None: ...
