from typing import Set
from collections import Counter
import random

from .board_normalizer import board_to_str
from .board_normalizer import BoardInput

SYM_MAPS = [
    (0, 1, 2, 3, 4, 5, 6, 7, 8),  # identity
    (6, 3, 0, 7, 4, 1, 8, 5, 2),  # rotate 90
    (8, 7, 6, 5, 4, 3, 2, 1, 0),  # rotate 180
    (2, 5, 8, 1, 4, 7, 0, 3, 6),  # rotate 270
    (2, 1, 0, 5, 4, 3, 8, 7, 6),  # mirror vertical axis
    (6, 7, 8, 3, 4, 5, 0, 1, 2),  # mirror horizontal axis
    (0, 3, 6, 1, 4, 7, 2, 5, 8),  # mirror main diagonal
    (8, 5, 2, 7, 4, 1, 6, 3, 0),  # mirror anti-diagonal
]


LINES = [
    (0, 1, 2),
    (3, 4, 5),
    (6, 7, 8),
    (0, 3, 6),
    (1, 4, 7),
    (2, 5, 8),
    (0, 4, 8),
    (2, 4, 6),
]


def all_symmetries(board: BoardInput) -> list[str]:
    """
    Generates all 8 symmetric variations of the board string (rotations and reflections).

    Args:
        board: board as str, flat list/tuple, or 3x3 list/tuple

    Returns:
        list[str]: List of symmetric board strings
    """
    board_str = board_to_str(board)
    return ["".join(board_str[index] for index in mapping) for mapping in SYM_MAPS]


def canonical(board: BoardInput) -> str:
    """
    Returns the canonical (lexicographically smallest) form of the board.

    Args:
        board: board as str, flat list/tuple, or 3x3 list/tuple

    Returns:
        The canonical board string
    """
    return min(all_symmetries(board))


def choose_weighted_move(moves_with_weights: dict) -> int | None:
    """Chooses a move based on weighted probabilities."""
    if not moves_with_weights:
        return None
    keys = list(moves_with_weights.keys())
    weights = list(moves_with_weights.values())
    return random.choices(keys, weights=weights, k=1)[0]


def winner_of(board: BoardInput) -> str | None:
    """Determines the winner of the Tic-Tac-Toe game represented by the board string.
    Args:
        board: board as str, flat list/tuple, or 3x3 list/tuple
    Returns:
        (str | None): 'X' if X has won, 'O' if O has won, None otherwise
    """
    board_str = board_to_str(board)
    for a, b, c in LINES:
        if board_str[a] != "_" and board_str[a] == board_str[b] == board_str[c]:
            return board_str[a]
    return None


def is_terminal(board: BoardInput) -> bool:
    """
    Checks whether the game has reached a terminal state.

    Args:
        board: board as str, flat list/tuple, or 3x3 list/tuple

    Returns:
        bool: True if the board is a win or draw, False otherwise
    """
    board_str = board_to_str(board)
    if winner_of(board_str):
        return True
    return "_" not in board_str


def generate_canonical_positions() -> tuple[Set[str], Counter]:
    """
    Generates all valid canonical board positions.
    Returns:
        tuple(Set[str], Counter): A tuple containing:
        - seen_canon (Set[str]): Set of canonical board strings
        - category_counter (Counter): Counter of status categories ('X_won', 'O_won', 'draw', 'ongoing')
    """

    seen_canon: Set[str] = set()
    category_counter = Counter()

    def turn_of(s: str) -> str:
        x = s.count("X")
        o = s.count("O")
        return "X" if x == o else "O"

    def recurse(board: str):
        canon = canonical(board)
        if canon in seen_canon:
            return
        seen_canon.add(canon)

        result = winner_of(board)
        if result:
            category_counter[f"{result}_won"] += 1
            return
        if "_" not in board:
            category_counter["draw"] += 1
            return

        category_counter["ongoing"] += 1

        player = turn_of(board)
        for i, cell in enumerate(board):
            if cell == "_":
                new = board[:i] + player + board[i + 1 :]
                recurse(new)

    recurse("_________")
    return (
        seen_canon,
        category_counter,
    )


def generate_ongoing_canonical_positions() -> list[str]:
    """
    Generates all ongoing canonical board positions.
    Returns:
        List of ongoing canonical board strings
    """
    canon_set, _ = generate_canonical_positions()
    ongoing_set = {s for s in canon_set if (winner_of(s) is None and "_" in s)}
    return list(ongoing_set)


def canonical_with_map(
    board: BoardInput,
) -> tuple[str, tuple[int, int, int, int, int, int, int, int, int]]:
    """
    Returns the canonical form of the board along with the mapping used.

    Args:
        board: board as str, flat list/tuple, or 3x3 list/tuple
    Returns:
        tuple(str, tuple[int, int, int, int, int, int, int, int, int]): The canonical board string and the mapping used
    """
    board_str = board_to_str(board)
    best_map = SYM_MAPS[0]
    best_str = "".join(board_str[i] for i in best_map)
    for mapping in SYM_MAPS:
        s = "".join(board_str[i] for i in mapping)
        if best_str is None or s < best_str:
            best_str = s
            best_map = mapping
    return best_str, best_map


def init_menace_data(base_beads=3) -> dict[str, dict[int, int]]:
    """
    Initializes the MENACE matchboxes for all ongoing canonical positions.
    Each empty cell becomes a key in the matchbox with value of initial bead count.

    Args:
        base_beads: Initial bead count for each empty cell
    Returns:
        dict[str, dict[int, int]]: Dictionary mapping canonical board strings to their matchboxes
    """
    ongoing_set = generate_ongoing_canonical_positions()
    matchboxes = {}
    for board in ongoing_set:
        empty_indices = [i for i, cell in enumerate(board) if cell == "_"]
        matchboxes[board] = {i: base_beads for i in empty_indices}
    return matchboxes


if __name__ == "__main__":
    generate_ongoing_canonical_positions()
