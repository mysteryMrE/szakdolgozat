from abc import ABC, abstractmethod


class Player(ABC):
    """Abstract base class for all player implementations."""

    def __init__(self, player_id: str, player_name: str, player_type: str):
        self._player_id = player_id
        self._player_name = player_name
        self._type = player_type

    def get_id(self) -> str:
        return self._player_id

    def get_type(self) -> str:
        return self._type

    def get_name(self) -> str:
        return self._player_name

    @abstractmethod
    async def get_move(self, board: list[str | None]) -> int:
        if board.count(None) == 0 or len(board) != 9:
            raise ValueError(
                "Board must have exactly 9 positions with at least one empty spot."
            )
