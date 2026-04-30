from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from app.services.session_pruning_service import SessionPruningService


class TestSessionPruningService:

    async def test_partial_cleanup_prunes_with_ttl_cutoff(self):
        db = MagicMock()
        db.prune_expired_sessions = AsyncMock()
        auth = MagicMock()
        ttl_value = 120
        auth.get_refresh_ttl = MagicMock(return_value=ttl_value)

        service = SessionPruningService(db, auth)

        time_now = datetime.now(timezone.utc).replace(tzinfo=None)
        await service.partial_cleanup()

        db.prune_expired_sessions.assert_awaited_once()
        cutoff_used = db.prune_expired_sessions.await_args.args[0]

        assert cutoff_used.tzinfo is None
        seconds_should_be = (time_now - cutoff_used).total_seconds()
        assert ttl_value - 1 <= seconds_should_be <= ttl_value + 1

    async def test_partial_cleanup_swallows_db_errors(self):
        class MyError(Exception):
            pass

        db = MagicMock()
        db.prune_expired_sessions = AsyncMock(side_effect=MyError)
        auth = MagicMock()
        auth.get_refresh_ttl = MagicMock(return_value=60)

        service = SessionPruningService(db, auth)

        await service.partial_cleanup()
        db.prune_expired_sessions.assert_awaited_once()
