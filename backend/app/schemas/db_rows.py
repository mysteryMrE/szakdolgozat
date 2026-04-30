from datetime import datetime
from typing import Any, TypedDict


class NetworkDbRow(TypedDict):
    id: str
    user_id: str
    name: str
    nn_json: dict[str, Any]
    meta_json: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime


class UserDbRow(TypedDict):
    id: str
    username: str
    username_lower: str
    password_hash: str
    created_at: datetime


class SessionDbRow(TypedDict):
    id: str
    user_id: str
    refresh_hash: str
    created_at: datetime
    last_seen: datetime


class MenaceDbRow(TypedDict):
    id: str
    user_id: str
    name: str
    matchboxes_json: dict[str, Any]
    meta_json: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime


class EvoNetworkDbRow(TypedDict):
    id: str
    user_id: str
    nn_json: dict[str, Any]
    meta_json: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
