from app.game import HumanPlayer
from app.game.player import Player
from .player_creator import PlayerCreator


class HumanPlayerCreator(PlayerCreator):
    async def create(
        self,
        player_id: str | None = None,
        player_name: str | None = None,
    ) -> Player | None:
        return HumanPlayer()
