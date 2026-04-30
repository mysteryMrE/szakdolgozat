from datetime import datetime
from sqlalchemy import (
    ForeignKey,
    Computed,
    Index,
    MetaData,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, DeclarativeBase, mapped_column
from app.schemas.db_rows import NetworkDbRow
from app.schemas.db_rows import UserDbRow
from app.schemas.db_rows import SessionDbRow
from app.schemas.db_rows import MenaceDbRow
from app.schemas.db_rows import EvoNetworkDbRow
from app.core.config import config
from app.utils.time import utcnow_naive


SCHEMA_NAME = config.get_db_schema()
meta_data = MetaData(schema=SCHEMA_NAME)


class Base(DeclarativeBase):
    metadata = meta_data


class User(Base):

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    username_lower: Mapped[str] = mapped_column(
        Computed("LOWER(username)", persisted=True), unique=True
    )
    password_hash: Mapped[str] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
    )

    def to_dict(self) -> UserDbRow:
        return {
            "id": self.id,
            "username": self.username,
            "username_lower": self.username_lower,
            "password_hash": self.password_hash,
            "created_at": self.created_at,
        }


class Network(Base):

    __tablename__ = "networks"
    __table_args__ = (Index("idx_networks_user", "user_id"),)

    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column()
    nn_json: Mapped[dict] = mapped_column(JSONB)
    meta_json: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
        onupdate=utcnow_naive,
    )

    def to_dict(self) -> NetworkDbRow:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "nn_json": self.nn_json,
            "meta_json": self.meta_json,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class Session(Base):

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
    )
    refresh_hash: Mapped[str] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
    )
    last_seen: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
    )

    def to_dict(self) -> SessionDbRow:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "refresh_hash": self.refresh_hash,
            "created_at": self.created_at,
            "last_seen": self.last_seen,
        }


class Menace(Base):

    __tablename__ = "menaces"
    __table_args__ = (Index("idx_menaces_user", "user_id"),)

    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column()
    matchboxes_json: Mapped[dict] = mapped_column(JSONB)
    meta_json: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
        onupdate=utcnow_naive,
    )

    def to_dict(self) -> MenaceDbRow:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "matchboxes_json": self.matchboxes_json,
            "meta_json": self.meta_json,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class EvoNetwork(Base):

    __tablename__ = "evo_networks"
    __table_args__ = (Index("idx_evo_networks_user", "user_id"),)

    id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    nn_json: Mapped[dict] = mapped_column(JSONB)
    meta_json: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=utcnow_naive,
        onupdate=utcnow_naive,
    )

    def to_dict(self) -> EvoNetworkDbRow:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "nn_json": self.nn_json,
            "meta_json": self.meta_json,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
