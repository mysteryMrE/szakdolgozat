from typing import Protocol, runtime_checkable


@runtime_checkable
class PlayerLike(Protocol):
    """Contract for duck typing runtime player objects."""

    def get_id(self) -> str: ...

    def get_type(self) -> str: ...

    def get_name(self) -> str: ...

    async def get_move(self, board: list[str | None]) -> int: ...
