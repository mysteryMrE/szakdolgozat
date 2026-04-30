from app.game import RandomPlayer
from app.game.player import Player
from .player_creator import PlayerCreator


class RandomPlayerCreator(PlayerCreator):
    async def create(
        self,
        player_id: str | None = None,
        player_name: str | None = None,
    ) -> Player | None:
        return RandomPlayer(player_name)
