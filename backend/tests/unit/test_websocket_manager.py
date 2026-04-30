import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from fastapi import WebSocketDisconnect
from app.services.managers.websocket_manager import WebSocketManager


class TestWebSocketManager:

    def test_manager_initialization(self, ws_manager: WebSocketManager):
        assert ws_manager.active_sockets == {}
        assert ws_manager.active_users == {}
        assert ws_manager.send_locks == {}

    async def test_handle_connection(self, ws_manager: WebSocketManager):
        mock_websocket = AsyncMock()
        mock_websocket.accept = AsyncMock()

        ws_manager._clear_old_socket = AsyncMock()

        ws_id = await ws_manager.handle_connection(mock_websocket, "user123.abc")

        assert ws_id == "user123.abc"
        assert "user123.abc" in ws_manager.active_sockets
        assert "user123" in ws_manager.active_users
        assert "user123.abc" in ws_manager.send_locks
        mock_websocket.accept.assert_awaited_once()
        ws_manager._clear_old_socket.assert_awaited_once_with("user123.abc")

    async def test_handle_connection_replaces_old(self, ws_manager: WebSocketManager):
        old_ws = AsyncMock()
        old_ws.accept = AsyncMock()
        old_ws.close = AsyncMock()
        await ws_manager.handle_connection(old_ws, "user123.old")
        new_ws = AsyncMock()
        new_ws.accept = AsyncMock()
        await ws_manager.handle_connection(new_ws, "user123.new")

        old_ws.close.assert_awaited_once()
        assert "user123.new" in ws_manager.active_sockets
        assert ws_manager.active_users["user123"] == "user123.new"
        assert "user123.new" in ws_manager.send_locks
        assert "user123.old" in ws_manager.send_locks

    async def test_send_message(self, ws_manager: WebSocketManager):
        mock_ws = AsyncMock()
        mock_ws.accept = AsyncMock()
        mock_ws.send_json = AsyncMock()

        await ws_manager.handle_connection(mock_ws, "user123.abc")
        await ws_manager.send_message("user123.abc", {"type": "test"})

        mock_ws.send_json.assert_awaited_once()
        sent_message = mock_ws.send_json.await_args.args[0]
        assert sent_message["type"] == "test"
        assert "time" in sent_message
        assert isinstance(sent_message["time"], str)

    async def test_send_message_nonexistent_socket(self, ws_manager: WebSocketManager):
        try:
            await ws_manager.send_message("nonexistent", {"type": "test"})
        except Exception as e:
            pytest.fail(f"send_message raised an exception unexpectedly: {e}")

        assert True

    async def test_receive_message(self, ws_manager: WebSocketManager):
        mock_ws = AsyncMock()
        mock_ws.accept = AsyncMock()
        mock_ws.receive_json = AsyncMock(return_value={"type": "test"})

        await ws_manager.handle_connection(mock_ws, "user123.abc")
        message = await ws_manager.receive_message("user123.abc")

        assert message == {"type": "test"}
        mock_ws.receive_json.assert_awaited_once()

    async def test_receive_message_nonexistent_socket(
        self, ws_manager: WebSocketManager
    ):
        message = await ws_manager.receive_message("nonexistent")
        assert message is None

    async def test_receive_message_disconnect_raises(
        self, ws_manager: WebSocketManager
    ):
        mock_ws = AsyncMock()
        mock_ws.accept = AsyncMock()
        mock_ws.receive_json = AsyncMock(side_effect=WebSocketDisconnect)

        await ws_manager.handle_connection(mock_ws, "user123.abc")

        with pytest.raises(WebSocketDisconnect):
            await ws_manager.receive_message("user123.abc")

    async def test_receive_message_error_swallowed(self, ws_manager: WebSocketManager):
        mock_ws = AsyncMock()
        mock_ws.accept = AsyncMock()
        mock_ws.receive_json = AsyncMock(side_effect=RuntimeError)

        await ws_manager.handle_connection(mock_ws, "user123.abc")

        await ws_manager.receive_message("user123.abc")

    def test_remove_socket_and_lock(self, ws_manager: WebSocketManager):
        ws_manager.active_sockets["user123.abc"] = MagicMock()
        ws_manager.send_locks["user123.abc"] = MagicMock()

        ws_manager.remove_socket_and_lock("user123.abc")

        assert "user123.abc" not in ws_manager.active_sockets
        assert "user123.abc" not in ws_manager.send_locks

    def test_remove_user(self, ws_manager: WebSocketManager):
        ws_manager.active_users["user123"] = "user123.abc"

        ws_manager.remove_user("user123", "user123.abc")

        assert "user123" not in ws_manager.active_users

    def test_remove_user_wrong_ws_id(self, ws_manager: WebSocketManager):
        ws_manager.active_users["user123"] = "user123.new"

        ws_manager.remove_user("user123", "user123.old")

        assert "user123" in ws_manager.active_users
        assert ws_manager.active_users["user123"] == "user123.new"

    def test_get_websocket_id(self, ws_manager: WebSocketManager):
        ws_manager.active_users["user123"] = "user123.abc"

        ws_id = ws_manager.get_websocket_id("user123")
        assert ws_id == "user123.abc"

    def test_get_websocket_id_nonexistent(self, ws_manager: WebSocketManager):
        ws_id = ws_manager.get_websocket_id("nonexistent")
        assert ws_id is None

    def test_try_register_guest_ip_enforces_limit_same(
        self, ws_manager: WebSocketManager
    ):
        assert ws_manager.try_register_guest_ip("guest.1", "1.2.3.4", limit=2) is True
        assert ws_manager.try_register_guest_ip("guest.2", "1.2.3.4", limit=2) is True
        assert ws_manager.try_register_guest_ip("guest.3", "1.2.3.4", limit=2) is False

    def test_try_register_guest_ip_enforces_limit_different(
        self, ws_manager: WebSocketManager
    ):
        assert ws_manager.try_register_guest_ip("guest.1", "1.2.3.4", limit=2) is True
        assert ws_manager.try_register_guest_ip("guest.2", "1.2.3.4", limit=2) is True
        assert ws_manager.try_register_guest_ip("guest.3", "1.2.3.5", limit=2) is True

    def test_try_register_guest_ip_non_positive_limit(
        self, ws_manager: WebSocketManager
    ):
        assert ws_manager.try_register_guest_ip("guest.1", "1.2.3.4", limit=0) is False
        assert ws_manager.try_register_guest_ip("guest.2", "1.2.3.4", limit=-1) is False

    def test_unregister_guest_ip(self, ws_manager: WebSocketManager):
        ws_manager.try_register_guest_ip("guest.1", "1.2.3.4", limit=1)
        assert ws_manager._guest_ws_to_ip["guest.1"] == "1.2.3.4"
        assert ws_manager._guest_ip_counts["1.2.3.4"] == 1

        ws_manager.unregister_guest_ip("guest.1")

        assert "guest.1" not in ws_manager._guest_ws_to_ip
        assert "1.2.3.4" not in ws_manager._guest_ip_counts

    def test_unregister_guest_ip_unknown(self, ws_manager: WebSocketManager):
        ws_manager.try_register_guest_ip("guest.1", "1.2.3.4", limit=1)
        assert ws_manager._guest_ws_to_ip["guest.1"] == "1.2.3.4"
        assert ws_manager._guest_ip_counts["1.2.3.4"] == 1
        ws_manager.unregister_guest_ip("unknown")

        assert ws_manager._guest_ws_to_ip["guest.1"] == "1.2.3.4"
        assert ws_manager._guest_ip_counts["1.2.3.4"] == 1

    async def test_cleanup_empty(self, ws_manager: WebSocketManager):
        ws_manager.active_sockets = {"user123.abc": MagicMock()}
        ws_manager.active_users = {"user123": "user123.abc"}
        ws_manager.send_locks = {"user123.abc": MagicMock()}
        ws_manager.try_register_guest_ip("guest.1", "1.2.3.4", limit=2)
        await ws_manager.full_cleanup()
        assert ws_manager.active_sockets == {}
        assert ws_manager.active_users == {}
        assert ws_manager.send_locks == {}
        assert ws_manager._guest_ws_to_ip == {}
        assert ws_manager._guest_ip_counts == {}

    async def test_send_message_timeout_raises_disconnect(
        self, ws_manager: WebSocketManager
    ):
        mock_ws = AsyncMock()
        mock_ws.accept = AsyncMock()
        mock_ws.send_json = AsyncMock(side_effect=asyncio.TimeoutError())

        await ws_manager.handle_connection(mock_ws, "user123.abc")

        with pytest.raises(WebSocketDisconnect, match="3008"):
            await ws_manager.send_message("user123.abc", {"type": "test"})

    async def test_cleanup_with_connections(self, ws_manager: WebSocketManager):
        mock_ws1 = AsyncMock()
        mock_ws1.accept = AsyncMock()
        mock_ws1.close = AsyncMock()

        mock_ws2 = AsyncMock()
        mock_ws2.accept = AsyncMock()
        mock_ws2.close = AsyncMock()

        await ws_manager.handle_connection(mock_ws1, "user1.abc")
        await ws_manager.handle_connection(mock_ws2, "user2.def")

        await ws_manager.send_message("user1.abc", {"type": "test1"})
        await ws_manager.send_message("user2.def", {"type": "test2"})

        assert len(ws_manager.active_sockets) == 2
        assert len(ws_manager.active_users) == 2
        assert len(ws_manager.send_locks) == 2

        await ws_manager.full_cleanup()

        mock_ws1.close.assert_awaited_once()
        mock_ws2.close.assert_awaited_once()

        assert ws_manager.active_sockets == {}
        assert ws_manager.active_users == {}
        assert ws_manager.send_locks == {}
