from app.core.config import config
from app.core.logger import AppLogger
from app.database.dao_interfaces import NetworkDao
from app.database.database_manager import db_manager
from app.game import NeuralNetworkPlayer
from app.game.player import Player
from app.neural_networks import NeuralNetwork
from .player_creator import PlayerCreator

from app.schemas.player_type import PlayerType

logger = AppLogger(__name__)


class BackpropNNCreator(PlayerCreator):
    def __init__(self):
        self.default_id = config.get_default_backprop_nn_id()

    async def create(
        self,
        player_id: str | None = None,
        player_name: str | None = None,
    ) -> Player | None:
        db: NetworkDao = db_manager.get_database()
        try:
            if player_id is not None:
                logger.debug(f"Looking for Neural Network player {player_id} in DB")
                data = await db.get_network_by_id(player_id)
            else:
                logger.debug(
                    f"Looking for default Neural Network player {self.default_id} in DB"
                )
                data = await db.get_network_by_id_user(self.default_id, "admin")
            if data is not None:
                network_dict = data["nn_json"]
                model = NeuralNetwork(network_dict)
                name = player_name or data.get("name", "Unknown Neural Network")
                return NeuralNetworkPlayer(
                    player_id or self.default_id,
                    PlayerType.BACKPROP_NN.value,
                    model,
                    name,
                )
        except Exception as e:
            logger.error(f"Error fetching Neural Network player from DB: {e}")

        logger.warning("Backprop Neural Network player not found in DB")
        return None
