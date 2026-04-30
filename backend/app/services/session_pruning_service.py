from datetime import datetime, timedelta, timezone
from app.core.logger import AppLogger
from app.database import SessionDao
from .authenticator import Authenticator

logger = AppLogger(__name__)


class SessionPruningService:

    def __init__(self, db: SessionDao, auth: Authenticator):
        """
        Args:
            db: Database access for sessions
            auth: Authentication service (for TTL retrieval)
        """
        self._db = db
        self._auth = auth

    async def partial_cleanup(self):
        """Prune sessions older than the configured TTL."""

        try:
            ttl = self._auth.get_refresh_ttl()
            cutoff_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(
                seconds=ttl
            )
            await self._db.prune_expired_sessions(cutoff_time)

        except Exception as e:
            logger.error(f"[SESSION_PRUNE] Failed to prune sessions: {e}")
