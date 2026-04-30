from app.core.logger import AppLogger
from app.game.player import Player
from app.services.creators import (
    BackpropNNCreator,
    GeneticNNCreator,
    HumanPlayerCreator,
    MenacePlayerCreator,
    MinimaxPlayerCreator,
    PlayerCreator,
    RandomPlayerCreator,
)
from app.schemas.player_type import PlayerType
from app.services.singleton import Singleton

logger = AppLogger(__name__)


class PlayerFactory(metaclass=Singleton):
    """Registry-based singleton responsible for creating player instances."""

    def __init__(self):
        self._creators: dict[PlayerType, PlayerCreator] = {}
        self._register_defaults()

    def register(self, player_type: PlayerType, creator: PlayerCreator) -> None:
        self._creators[player_type] = creator

    def _register_defaults(self) -> None:
        self.register(PlayerType.RANDOM, RandomPlayerCreator())
        self.register(PlayerType.MENACE, MenacePlayerCreator())
        self.register(PlayerType.BACKPROP_NN, BackpropNNCreator())
        self.register(PlayerType.GENETIC_NN, GeneticNNCreator())
        self.register(PlayerType.HUMAN, HumanPlayerCreator())
        self.register(PlayerType.MINIMAX, MinimaxPlayerCreator())

    async def create_player(
        self,
        player_type: PlayerType | str,
        player_name: str | None = None,
        player_id: str | None = None,
    ) -> Player | None:
        """
        Creates a player through the registered creator for the requested type.

        Args:
            player_type: Enum or string value of the player type.
            player_name: Optional name for the player.
            player_id: Optional ID for player types backed by persistent storage.

        Returns:
            (Player | None): Created player instance or None if type is unknown or creation fails.
        """
        normalized_type = PlayerFactory._normalize_player_type(player_type)
        if normalized_type is None:
            logger.error(f"Unknown player type requested: {player_type}")
            return None

        creator = self._creators.get(normalized_type)
        if creator is None:
            logger.error(
                f"No creator registered for player type: {normalized_type.value}"
            )
            return None

        return await creator.create(player_id, player_name)

    @staticmethod
    def _normalize_player_type(player_type: PlayerType | str) -> PlayerType | None:
        if isinstance(player_type, PlayerType):
            return player_type

        if isinstance(player_type, str):
            try:
                return PlayerType(player_type)
            except ValueError:
                return None

        return None


player_factory: PlayerFactory = PlayerFactory.get_instance()
