from abc import ABC
from .database_connection_interface import DatabaseConnection
from .dao_interfaces.evolution import EvolutionDao
from .dao_interfaces.session import SessionDao
from .dao_interfaces.user import UserDao
from .dao_interfaces.menace import MenaceDao
from .dao_interfaces.network import NetworkDao


class DatabaseGateway(
    DatabaseConnection,
    EvolutionDao,
    SessionDao,
    UserDao,
    MenaceDao,
    NetworkDao,
    ABC,
):
    """Interface for database gateway."""
