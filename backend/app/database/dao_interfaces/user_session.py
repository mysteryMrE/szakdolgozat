from abc import ABC
from .user import UserDao
from .session import SessionDao


class UserSessionDao(UserDao, SessionDao, ABC):
    """Interface for operations that require both user and session access."""
