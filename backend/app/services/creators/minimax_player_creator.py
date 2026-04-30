from app.game import MinimaxPlayer
from app.game.player import Player
from .player_creator import PlayerCreator


class MinimaxPlayerCreator(PlayerCreator):
    async def create(
        self,
        player_id: str | None = None,
        player_name: str | None = None,
    ) -> Player | None:
        return MinimaxPlayer(player_name)
