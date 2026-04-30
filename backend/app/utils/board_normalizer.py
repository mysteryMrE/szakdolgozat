from multipledispatch import Dispatcher
from typing import Iterable, TypeAlias

_ALLOWED = {"X", "O", "_"}

CellInput: TypeAlias = str | None
BoardRowInput: TypeAlias = list[CellInput] | tuple[CellInput, ...]
BoardGridInput: TypeAlias = list[BoardRowInput] | tuple[BoardRowInput, ...]
BoardInput: TypeAlias = str | BoardRowInput | BoardGridInput


def _normalize_cell(cell: CellInput) -> str:
    if cell is None:
        return "_"
    if isinstance(cell, str):
        value = cell.strip().upper()
        if value == "":
            return "_"
        if value in _ALLOWED:
            return value
    raise ValueError(f"unsupported board cell: {repr(cell)}")


def _validate_board_string(board: str) -> str:
    if len(board) != 9:
        raise ValueError(f"board length must be 9, got {len(board)}")
    return board


def _normalize_and_validate_board(board: Iterable[CellInput]) -> str:
    normalized = "".join(_normalize_cell(cell) for cell in board)
    return _validate_board_string(normalized)


normalize_board = Dispatcher("normalize_board")


@normalize_board.register(str)
def _normalize_board_str(board: str) -> str:
    return _normalize_and_validate_board(board)


@normalize_board.register(list)
def _normalize_board_list(board: list) -> str:
    # Flat board
    if len(board) == 9 and not any(isinstance(item, (list, tuple)) for item in board):
        return _normalize_and_validate_board(board)

    # 3x3 board
    if len(board) == 3 and all(
        isinstance(row, (list, tuple)) and len(row) == 3 for row in board
    ):
        flat = []
        for row in board:
            flat.extend(row)
        return _normalize_and_validate_board(flat)

    raise ValueError("Unsupported list board shape. Must be flat or 3x3")


@normalize_board.register(tuple)
def _normalize_board_tuple(board: tuple) -> str:
    return normalize_board(list(board))


@normalize_board.register(object)
def _normalize_board_unsupported(board: object) -> str:
    raise TypeError(
        f"Unsupported board type: {type(board).__name__}. Supported types: str, list, tuple"
    )


def board_to_str(board: BoardInput) -> str:
    """Normalize a board (string, flat list/tuple, or 3x3 list/tuple) into a 9-char string."""
    return normalize_board(board)


def board_to_list(board: BoardInput) -> list[str | None]:
    """Normalize a board and return it as a flat list where '_' is converted to None."""
    normalized = normalize_board(board)
    return [char if char != "_" else None for char in normalized]
