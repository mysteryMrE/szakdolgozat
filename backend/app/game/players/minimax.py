import asyncio
from ..player import Player
from app.utils import minimax
from app.services.managers.resource_manager import resources
import random
from app.utils import canonical_with_map


class MinimaxPlayer(Player):
    """Represents a Minimax player in the game."""

    _move_cache = {}
    _optimal_openings = [0, 2, 4, 6, 8]

    def __init__(self, player_name: str | None = None):
        super().__init__(
            player_id="MinimaxID",
            player_name=player_name if player_name is not None else "Minimax",
            player_type="minimax",
        )

    # IMPORTANT: only works if called in an event loop
    async def get_move(self, board: list[str | None]) -> int:
        """
        Selects a move based on the current board state using the Minimax algorithm.
        Uses a class-level cache to store and retrieve previously computed moves.

        Important: Must be called within an active event loop.
        """
        await super().get_move(board)
        empty_spaces = board.count(None)
        if empty_spaces == 9:
            return random.choice(MinimaxPlayer._optimal_openings)

        canonical_board, mapping = canonical_with_map(board)
        board_key = canonical_board

        if board_key in MinimaxPlayer._move_cache:
            canon_move = MinimaxPlayer._move_cache[board_key]
        else:
            canon_move = await self._compute_move(canonical_board, empty_spaces)
            MinimaxPlayer._move_cache[board_key] = canon_move

        return mapping[canon_move]

    async def _compute_move(self, board: str, empty_spaces: int) -> int:
        if empty_spaces < 5:
            return minimax(board)
        else:
            return await self._compute_move_in_process(board)

    async def _compute_move_in_process(self, board: str) -> int:
        async with resources.get_semaphore_strict():
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(resources.process_pool, minimax, board)


#   0 pieces - 9 empty: avg=1210.103ms (min=1179.201, max=1243.424) using preset moves
#   1 pieces - 8 empty: avg=133.513ms (min=129.982, max=136.691)
#   2 pieces - 7 empty: avg=17.448ms (min=17.209, max=17.677)
#   3 pieces - 6 empty: avg=3.092ms (min=2.969, max=3.427)
#   4 pieces - 5 empty: avg=1.590ms (min=0.505, max=3.807)
#   5 pieces - 4 empty: avg=0.118ms (min=0.095, max=0.142)
#   6 pieces - 3 empty: avg=0.015ms (min=0.014, max=0.017)
