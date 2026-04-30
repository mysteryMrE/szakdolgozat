import asyncio
from fastapi import Query
from app.database import DatabaseGateway, NetworkDao, UserSessionDao, DatabaseConnection
from app.database.database_manager import db_manager
from app.services.authenticator import Authenticator
from app.services.managers.bot_task_manager import BotTaskManager, bot_manager
from app.services.managers.game_manager import GameSessionManager, game_manager
from app.services.managers.resource_manager import ResourceManager, resources
from app.services.managers.train_job_manager import (
    TrainingJobManager,
    job_manager,
)
from app.services.managers.websocket_manager import WebSocketManager, ws_manager
from .config import AppConfig, config
from fastapi import Depends, HTTPException, Request
from app.schemas import User
from app.services.player_factory import PlayerFactory
from app.utils.error_wrappers import db_http_handler
from slowapi import Limiter
from typing import Annotated
from app.utils.auth import select_limit, key_by_user_or_ip


enabled = config.get_rate_limit_enabled()
limiter = Limiter(key_func=key_by_user_or_ip, enabled=enabled)


def rate_limiter(authenticated_limit: str, unauthenticated_limit: str | None = None):
    return limiter.limit(
        limit_value=select_limit(authenticated_limit, unauthenticated_limit)
    )


def get_db() -> DatabaseGateway:
    db = db_manager.get_database()
    return db


UserSessionDBDep = Annotated[UserSessionDao, Depends(get_db)]
NetworkDBDep = Annotated[NetworkDao, Depends(get_db)]
ConnectionDBDep = Annotated[DatabaseConnection, Depends(get_db)]


def get_player_factory() -> PlayerFactory:
    return PlayerFactory.get_instance()


PlayerFactoryDep = Annotated[PlayerFactory, Depends(get_player_factory)]


def get_authenticator() -> Authenticator:
    return Authenticator.get_instance()


AuthDep = Annotated[Authenticator, Depends(get_authenticator)]


def get_app_config() -> AppConfig:
    return AppConfig.get_instance()


ConfDep = Annotated[AppConfig, Depends(get_app_config)]


def get_resource_manager() -> ResourceManager:
    return resources


ResourceManagerDep = Annotated[ResourceManager, Depends(get_resource_manager)]


def get_websocket_manager() -> WebSocketManager:
    return ws_manager


WebSocketManagerDep = Annotated[WebSocketManager, Depends(get_websocket_manager)]


def get_game_manager() -> GameSessionManager:
    return game_manager


GameManagerDep = Annotated[GameSessionManager, Depends(get_game_manager)]


def get_bot_task_manager() -> BotTaskManager:
    return bot_manager


BotTaskManagerDep = Annotated[BotTaskManager, Depends(get_bot_task_manager)]


def get_train_job_manager() -> TrainingJobManager:
    return job_manager


TrainJobManagerDep = Annotated[TrainingJobManager, Depends(get_train_job_manager)]


async def get_user(
    request: Request,
    db: UserSessionDBDep,
) -> User:
    """
    Validates JWT token and returns the authenticated user.

    Decodes the access token, checks for the user in the database,
    and checks for an active session.

    Args:
        request: Request object containing state with auth_access_payload set by the authentication middleware
        db: Database dao for user and session queries

    Returns:
        User: Authenticated user object with id and username

    Raises:
        HTTPException: 401 if token is invalid, expired, user doesn't exist,
                       or user has no active session
        HTTPException: 500 for internal errors
    """
    payload = getattr(request.state, "auth_access_payload", None)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid access token")

    return await _validate_user_from_access_payload(db, payload)


UserDep = Annotated[User, Depends(get_user)]


async def get_optional_user_ws(
    user_id: str,
    auth: AuthDep,
    db: UserSessionDBDep,
    token: str | None = Query(None),
) -> User | None:
    """
    Validates JWT token from query parameters
    and returns the authenticated user if token is present.

    Guest users (user_id contains "guest") do not require a token.

    Args:
        user_id: User ID from path parameters
        token: JWT access token from query parameters
        auth: Authenticator instance for token decoding
        db: Database dao for user and session queries

    Returns:
        User: Authenticated user if token is valid, None for guest users

    Raises:
        HTTPException: 401 if token is missing or invalid for non-guest user
        HTTPException: 500 for internal errors
    """
    if "guest" in user_id:
        return None
    if not token:
        raise HTTPException(status_code=401, detail="Missing token for non-guest user")

    payload = auth.decode_access(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid access token")

    return await _validate_user_from_access_payload(db, payload)


GuestOrUserDep = Annotated[User | None, Depends(get_optional_user_ws)]


async def _validate_user_from_access_payload(db: UserSessionDao, payload: dict) -> User:
    """
    Validates user and session from an already verified access-token payload.

    Args:
        db: Database dao for user and session queries
        payload: Decoded and verified access-token payload

    Returns:
        User: Authenticated user object with id and username

    Raises:
        HTTPException: 401 if user/session is invalid
    """

    uid = payload.get("sub")
    uname = payload.get("username")
    sid = payload.get("sid")

    urow, session = await asyncio.gather(
        db_http_handler(db.get_user_by_id)(user_id=uid),
        db_http_handler(db.get_session_for_user)(user_id=uid),
    )

    if not urow or urow.get("username") != uname:
        raise HTTPException(status_code=401, detail="Invalid user")

    if not session:
        raise HTTPException(status_code=401, detail="User has no active session")

    if (
        session.get("id") != sid
    ):  # session id mismatch, user logged out / logged in since token was issued
        raise HTTPException(status_code=401, detail="Invalid access token")

    return User(id=str(uid), username=str(uname))
