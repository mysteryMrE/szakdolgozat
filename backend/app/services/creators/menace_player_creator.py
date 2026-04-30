from app.core.config import config
from app.core.logger import AppLogger
from app.database import MenaceDao
from app.database.database_manager import db_manager
from app.game import MenacePlayer
from app.game.player import Player
from .player_creator import PlayerCreator

logger = AppLogger(__name__)


class MenacePlayerCreator(PlayerCreator):
    def __init__(self):
        self.default_id = config.get_default_menace_id()

    async def create(
        self,
        player_id: str | None = None,
        player_name: str | None = None,
    ) -> Player | None:
        db: MenaceDao = db_manager.get_database()

        try:
            if player_id is not None:
                logger.debug(f"Looking for Menace player {player_id} in DB")
                data = await db.get_menace(player_id)
            else:
                logger.debug(
                    f"Looking for default Menace player {self.default_id} in DB"
                )
                data = await db.get_menace(self.default_id)

            if data is not None:
                name = player_name or data["name"]
                return MenacePlayer(
                    player_id or self.default_id,
                    name,
                    data["matchboxes_json"],
                )
        except Exception as e:
            logger.error(f"Error fetching Menace player from DB: {e}")

        logger.warning("Menace player not found in DB (no default available)")
        return None
