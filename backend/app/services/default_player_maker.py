from app.core.config import config as app_config
from app.database import (
    MenaceDao,
    NetworkDao,
    EvolutionDao,
)
from app.database.database_manager import db_manager
from app.utils import init_menace_data, init_network
from .trainers.menace import MenaceTrainer
from .trainers.backprop import BackpropTrainer
from .trainers.genetic import GeneticTrainer
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class DefaultPlayerMaker:
    """Class responsible for creating default AI players in the system."""

    @staticmethod
    async def create_menace(exploration: int = 10000, exploitation: int = 100000):
        """
        Creates and trains a default MENACE player with default id, if it does not already exist.
        """
        db: MenaceDao = db_manager.get_database()
        default_menace_id = app_config.get_default_menace_id()
        if await db.get_menace(default_menace_id) is not None:
            return
        matchboxes = init_menace_data()
        # do training
        matchboxes, meta_one = await MenaceTrainer.train_on_random(
            exploration, matchboxes
        )
        matchboxes, meta = await MenaceTrainer.train_on_menace(exploitation, matchboxes)
        meta["training_round_on_random"] = meta_one.get("training_round_on_random", 0)
        await db.insert_menace(
            default_menace_id,
            "admin",
            "menace_bot",
            matchboxes,
            meta,
        )

    @staticmethod
    async def create_backprop_nn(epochs: int = 1000):
        """
        Creates and trains a default backpropagation neural network player with default id, if it does not already exist.
        """
        db: NetworkDao = db_manager.get_database()
        default_backprop_nn_id = app_config.get_default_backprop_nn_id()
        if await db.get_network_by_id_user(default_backprop_nn_id, "admin") is not None:
            return
        network = init_network()
        trained_network, meta = BackpropTrainer.train_backprop(network, epochs, 0.01)
        await db.insert_network(
            default_backprop_nn_id,
            "admin",
            "backprop_nn_bot",
            trained_network.model_dump(),
            meta,
        )

    @staticmethod
    async def create_genetic_nn(
        individual_id: str | None = None,
        generations: int = 3,
        population_size: int = 20,
    ):
        """
        Creates and trains a default genetic neural network player with default id, if it does not already exist.
        """
        db: EvolutionDao = db_manager.get_database()
        default_genetic_nn_ind_id = app_config.get_default_genetic_nn_ind_id()
        if individual_id is None:
            if default_genetic_nn_ind_id is None:
                logger.warning(
                    "No default genetic individual id set, cannot create genetic individual"
                )
                return
            individual_id = default_genetic_nn_ind_id
        if await db.get_evolution_network_by_id(individual_id) is not None:
            logger.debug("Genetic individual already exists, skipping creation")
            return
        logger.debug(f"Creating genetic individual {individual_id}")
        network, meta = GeneticTrainer(
            pop_total=population_size, max_generations=generations
        ).let_the_games_begin()
        net_conf = network.to_config()
        await db.insert_evolution_network(
            individual_id,
            "admin",
            {
                "biases": net_conf["biases"],
                "weights": net_conf["weights"],
                "layers": net_conf["layers"],
            },
            meta,
        )

        logger.info(f"Genetic individual {individual_id} created")
