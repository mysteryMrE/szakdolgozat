from ..player import Player
from app.utils import choose_weighted_move, canonical_with_map


class MenacePlayer(Player):
    """
    Represents a Menace player in the game.

    Uses a shared set of matchboxes for all instances,
    because all Menace players are created from the default one.
    """

    _matchboxes: dict | None = None

    def __init__(self, player_id: str, player_name: str, matchboxes: dict):
        super().__init__(
            player_id=player_id,
            player_name=player_name if player_name else "Menace Bot",
            player_type="menace",
        )
        if MenacePlayer._matchboxes is None:
            MenacePlayer._matchboxes = matchboxes

    async def get_move(self, board: list[str | None]) -> int:
        """
        Selects a move based on the current board state using MENACE strategy.

        Finds the canonical form and retrieves the corresponding matchbox,
        then selects a move based on the weights.
        Finally maps the canonical move back to the original board indices.

        Args:
            board: Current board state as a list.

        Returns:
            int: The selected move index (0-8).

        Raises:
            ValueError: If no move can be found.
        """

        await super().get_move(board)

        if MenacePlayer._matchboxes is None:
            raise ValueError("MenacePlayer matchboxes not initialized")
        canonical_board, mapping = canonical_with_map(board)
        move_dict = MenacePlayer._matchboxes.get(canonical_board, {})
        canon_move = choose_weighted_move(move_dict)
        move = (
            mapping[int(canon_move)]
            if canon_move is not None and int(canon_move) in mapping
            else None
        )
        if move is None or move > 8 or move < 0 or board[move] is not None:
            return -1
        return int(move)

    @classmethod
    def reset_matchboxes(cls):
        cls._matchboxes = None
