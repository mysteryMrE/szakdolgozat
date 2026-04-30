from ..player import Player


class HumanPlayer(Player):
    """Represents a human player in the game."""

    def __init__(self):
        super().__init__(player_id="HumanID", player_name="Te", player_type="human")

    async def get_move(self, board: list[str | None]) -> int:
        """
        Human move should be provided externally.

        Raises:
            NotImplementedError: Human player move should not be called.

        Note:
            Needed for Player interface compatibility.
        """
        raise NotImplementedError("Human player move should not be called.")
