from datetime import datetime
from typing import Any
from sqlalchemy import select, text, update, delete, and_, func
from sqlalchemy.dialects.postgresql import insert
from ..database_gateway_interface import DatabaseGateway
from ..session_factory import AsyncSessionFactory
from ..models_postgres import Base, User, Network, Session, Menace, EvoNetwork
from app.schemas.db_rows import NetworkDbRow
from app.core.logger import AppLogger
from app.core.config import config as app_config
from app.utils.time import utcnow_naive

logger = AppLogger(__name__)
DB_SCHEMA = app_config.get_db_schema()


class PostgreSQLGateway(DatabaseGateway):
    """
    PostgreSQL-specific database gateway using SQLAlchemy.

    All methods use the shared session factory to get connections from the pool.
    """

    def __init__(self, session_factory: AsyncSessionFactory):
        """
        Initialize the gateway with a session factory.

        Args:
            session_factory: The async session factory for connection pooling
        """
        self._session_factory = session_factory

    # -------------------------------------------------------------------------
    # Lifecycle methods
    # -------------------------------------------------------------------------

    async def drop_schema(self) -> None:
        logger.info(f"[DATABASE] Dropping schema {DB_SCHEMA}...")
        async with self._session_factory.get_connection() as conn:
            await conn.execute(text(f"DROP SCHEMA IF EXISTS {DB_SCHEMA} CASCADE"))
        logger.info(f"[DATABASE] Schema {DB_SCHEMA} dropped successfully")

    async def create_database_tables(self) -> None:
        logger.info("[DATABASE] Creating database tables...")
        async with self._session_factory.get_connection() as conn:
            logger.info(f"[DATABASE] Ensuring schema {DB_SCHEMA} exists...")
            await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DB_SCHEMA}"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[DATABASE] Database tables created")

    async def close(self) -> None:
        await self._session_factory.close()

    async def open(self) -> None:
        pass

    async def check_connection(self) -> bool:
        return await self._session_factory.check_connection()

    # -------------------------------------------------------------------------
    # User methods
    # -------------------------------------------------------------------------

    async def create_user(
        self, user_id: str, user_name: str, password_hash: str
    ) -> None:
        """Create a new user."""
        async with self._session_factory.get_session() as session:
            user = User(
                id=user_id,
                username=user_name,
                password_hash=password_hash,
            )
            session.add(user)

    async def update_user(
        self, user_id: str, user_name: str, password_hash: str
    ) -> None:
        """Update an existing user."""
        async with self._session_factory.get_session() as session:
            stmt = (
                update(User)
                .where(User.id == user_id)
                .values(username=user_name, password_hash=password_hash)
            )
            await session.execute(stmt)

    async def delete_user(self, user_id: str) -> None:
        """Delete a user by ID."""
        async with self._session_factory.get_session() as session:
            stmt = delete(User).where(User.id == user_id)
            await session.execute(stmt)

    async def get_user_by_id(self, user_id: str):
        """Get a user by ID."""
        async with self._session_factory.get_session() as session:
            user = await session.get(User, user_id)
            return user.to_dict() if user else None

    async def get_user_by_name(self, user_name: str):
        """Get a user by username (case-sensitive)."""
        async with self._session_factory.get_session() as session:
            stmt = select(User).where(User.username == user_name)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            return user.to_dict() if user else None

    async def get_user_by_name_lower(self, user_name_lower: str):
        """Get a user by lowercase username."""
        async with self._session_factory.get_session() as session:
            stmt = select(User).where(User.username_lower == user_name_lower)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            return user.to_dict() if user else None

    # -------------------------------------------------------------------------
    # Network methods
    # -------------------------------------------------------------------------

    async def insert_network(
        self, network_id: str, user_id: str, name: str, nn: dict, meta: dict
    ) -> NetworkDbRow:
        """Insert a new neural network."""
        async with self._session_factory.get_session() as session:
            stmt = (
                insert(Network)
                .values(
                    id=network_id,
                    user_id=user_id,
                    name=name,
                    nn_json=nn,
                    meta_json=meta,
                )
                .returning(Network)
            )
            result = await session.execute(stmt)
            network = result.scalar_one()
            return network.to_dict()

    async def update_network(
        self,
        network_id: str,
        name: str | None = None,
        nn: dict[str, Any] | None = None,
        meta: dict[str, Any] | None = None,
    ) -> NetworkDbRow | None:
        """Update an existing network."""
        values: dict[str, Any] = {}

        if name is not None:
            values["name"] = name
        if nn is not None:
            values["nn_json"] = nn
        if meta is not None:
            values["meta_json"] = meta

        if not values:
            return None

        async with self._session_factory.get_session() as session:
            stmt = (
                update(Network)
                .where(Network.id == network_id)
                .values(**values)
                .returning(Network)
            )
            result = await session.execute(stmt)
            network = result.scalar_one_or_none()
            return network.to_dict() if network else None

    async def delete_network(self, network_id: str, user_id: str) -> None:
        """Delete a network by ID and user ID."""
        async with self._session_factory.get_session() as session:
            stmt = delete(Network).where(
                and_(Network.id == network_id, Network.user_id == user_id)
            )
            await session.execute(stmt)

    async def get_network_by_id(self, network_id: str):
        """Get a network by ID."""
        async with self._session_factory.get_session() as session:
            network = await session.get(Network, network_id)
            return network.to_dict() if network else None

    async def get_network_by_id_user(self, network_id: str, user_id: str):
        """Get a network by ID and user ID."""
        async with self._session_factory.get_session() as session:
            stmt = select(Network).where(
                and_(Network.id == network_id, Network.user_id == user_id)
            )
            result = await session.execute(stmt)
            network = result.scalar_one_or_none()
            return network.to_dict() if network else None

    async def list_networks_for_user(self, user_id: str, limit: int = 3):
        """List networks for a user, ordered by creation date."""
        async with self._session_factory.get_session() as session:
            stmt = (
                select(Network)
                .where(Network.user_id == user_id)
                .order_by(Network.created_at.desc())
                .limit(limit)
            )
            result = await session.execute(stmt)
            networks = result.scalars().all()
            return [n.to_dict() for n in networks]

    async def count_networks_for_user(self, user_id: str) -> int:
        """Count all networks for a user."""
        async with self._session_factory.get_session() as session:
            stmt = (
                select(func.count())
                .select_from(Network)
                .where(Network.user_id == user_id)
            )
            result = await session.execute(stmt)
            return int(result.scalar_one())

    # -------------------------------------------------------------------------
    # Session methods
    # -------------------------------------------------------------------------

    async def get_session_for_user(self, user_id: str):
        """Get an active session for a user."""
        async with self._session_factory.get_session() as session:
            stmt = select(Session).where(Session.user_id == user_id)
            result = await session.execute(stmt)
            auth_session = result.scalar_one_or_none()
            return auth_session.to_dict() if auth_session else None

    async def revoke_sessions_for_user(self, user_id: str):
        """Revoke session for a user."""
        async with self._session_factory.get_session() as session:
            stmt = delete(Session).where(Session.user_id == user_id)
            await session.execute(stmt)

    async def insert_session(self, session_id: str, user_id: str, refresh_hash: str):
        """Insert or update a session."""
        async with self._session_factory.get_session() as session:
            insert_stmt = insert(Session).values(
                id=session_id,
                user_id=user_id,
                refresh_hash=refresh_hash,
                last_seen=utcnow_naive(),
            )
            upsert_stmt = insert_stmt.on_conflict_do_update(
                index_elements=["user_id"],
                set_=dict(
                    id=insert_stmt.excluded.id,
                    refresh_hash=insert_stmt.excluded.refresh_hash,
                    last_seen=insert_stmt.excluded.last_seen,
                ),
            )

            await session.execute(upsert_stmt)

    async def get_session(self, session_id: str):
        """Get a session by ID."""
        async with self._session_factory.get_session() as session:
            auth_session = await session.get(Session, session_id)
            return auth_session.to_dict() if auth_session else None

    async def update_session_refresh(self, session_id: str, refresh_hash: str):
        """Update the refresh hash for a session."""
        async with self._session_factory.get_session() as session:
            stmt = (
                update(Session)
                .where(Session.id == session_id)
                .values(refresh_hash=refresh_hash)
            )
            await session.execute(stmt)

    async def touch_session(self, session_id: str) -> None:
        """Update the last_seen timestamp for a session."""
        async with self._session_factory.get_session() as session:
            stmt = (
                update(Session)
                .where(Session.id == session_id)
                .values(last_seen=utcnow_naive())
            )
            await session.execute(stmt)

    async def revoke_session(self, session_id: str) -> None:
        """Revoke a session."""
        async with self._session_factory.get_session() as session:
            stmt = delete(Session).where(Session.id == session_id)
            await session.execute(stmt)

    async def prune_expired_sessions(self, cutoff_time: datetime) -> int:
        """Delete expired sessions, return deleted count."""
        async with self._session_factory.get_session() as session:
            stmt = delete(Session).where(Session.last_seen < cutoff_time)
            result = await session.execute(stmt)
            return result.rowcount

    # -------------------------------------------------------------------------
    # Menace methods
    # -------------------------------------------------------------------------

    async def insert_menace(
        self, menace_id: str, user_id: str, name: str, matchboxes: dict, meta: dict
    ) -> None:
        """Insert a new MENACE player."""
        async with self._session_factory.get_session() as session:
            menace = Menace(
                id=menace_id,
                user_id=user_id,
                name=name,
                matchboxes_json=matchboxes,
                meta_json=meta,
            )
            session.add(menace)

    async def get_menace(self, menace_id: str):
        """Get a MENACE player by ID."""
        async with self._session_factory.get_session() as session:
            menace = await session.get(Menace, menace_id)
            return menace.to_dict() if menace else None

    async def delete_menace(self, menace_id: str, user_id: str):
        """Delete a MENACE player by ID and user ID."""
        async with self._session_factory.get_session() as session:
            stmt = delete(Menace).where(
                and_(Menace.id == menace_id, Menace.user_id == user_id)
            )
            await session.execute(stmt)

    async def list_menace_for_user(self, user_id: str):
        """List MENACE players for a user."""
        async with self._session_factory.get_session() as session:
            stmt = select(Menace).where(Menace.user_id == user_id)
            result = await session.execute(stmt)
            menaces = result.scalars().all()
            return [m.to_dict() for m in menaces]

    async def update_menace_matchboxes(self, menace_id: str, matchboxes: dict):
        """Update the matchboxes for a MENACE player."""
        async with self._session_factory.get_session() as session:
            stmt = (
                update(Menace)
                .where(Menace.id == menace_id)
                .values(matchboxes_json=matchboxes)
            )
            await session.execute(stmt)
            # menace = await session.get(Menace, menace_id)
            # if menace:
            #     menace.matchboxes_json = matchboxes

    async def update_menace_meta(self, menace_id: str, meta: dict):
        """Update the meta for a MENACE player."""
        async with self._session_factory.get_session() as session:
            stmt = (
                update(Menace)
                .where(Menace.id == menace_id)
                .values(
                    meta_json=meta,
                )
            )
            await session.execute(stmt)
            # menace = await session.get(Menace, menace_id)
            # if menace:
            #     menace.meta_json = meta

    # -------------------------------------------------------------------------
    # Evolution methods
    # -------------------------------------------------------------------------

    async def get_evolution_network_by_id(self, network_id: str):
        """Get an evolution network by ID."""
        async with self._session_factory.get_session() as session:
            network = await session.get(EvoNetwork, network_id)
            return network.to_dict() if network else None

    async def get_evolution_network_by_id_user(self, network_id: str, user_id: str):
        """Get an evolution network by ID and user ID."""
        async with self._session_factory.get_session() as session:
            stmt = select(EvoNetwork).where(
                and_(EvoNetwork.id == network_id, EvoNetwork.user_id == user_id)
            )
            result = await session.execute(stmt)
            network = result.scalar_one_or_none()
            return network.to_dict() if network else None

    async def insert_evolution_network(
        self,
        network_id: str,
        user_id: str,
        nn: dict[str, Any],
        meta: dict[str, Any] | None = None,
    ):
        """Insert a new evolution network."""
        async with self._session_factory.get_session() as session:
            network = EvoNetwork(
                id=network_id,
                user_id=user_id,
                nn_json=nn,
                meta_json=meta,
            )
            session.add(network)

    async def update_evolution_network(
        self,
        network_id: str,
        nn: dict[str, Any] | None = None,
        meta: dict[str, Any] | None = None,
    ) -> None:
        """Update an evolution network."""
        values: dict[str, Any] = {}

        if nn is not None:
            values["nn_json"] = nn
        if meta is not None:
            values["meta_json"] = meta

        if not values:
            return

        async with self._session_factory.get_session() as session:
            stmt = (
                update(EvoNetwork).where(EvoNetwork.id == network_id).values(**values)
            )
            await session.execute(stmt)

    async def delete_evolution_network(self, network_id: str):
        """Delete an evolution network by ID."""
        async with self._session_factory.get_session() as session:
            stmt = delete(EvoNetwork).where(EvoNetwork.id == network_id)
            await session.execute(stmt)
