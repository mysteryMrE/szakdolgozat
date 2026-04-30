import random
from ..player import Player


class RandomPlayer(Player):
    """Represents a Random player in the game."""

    def __init__(self, player_name: str | None = None):
        super().__init__(
            player_id="RandomID",
            player_name=player_name if player_name is not None else "Random",
            player_type="random",
        )

    async def get_move(self, board: list[str | None]) -> int:
        await super().get_move(board)
        available_moves = [i for i, spot in enumerate(board) if spot is None]
        return random.choice(available_moves)
