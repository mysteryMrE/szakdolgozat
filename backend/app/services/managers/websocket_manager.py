import asyncio
import datetime
from fastapi import WebSocket, WebSocketDisconnect
from app.core.logger import AppLogger
from ..singleton import Singleton

logger = AppLogger(__name__)


class WebSocketManager(metaclass=Singleton):
    """Singleton class that manages active WebSocket connections."""

    def __init__(self):
        self.active_sockets: dict[str, WebSocket] = {}
        self.active_users: dict[str, str] = {}  # maps user_id to ws_id
        self.send_locks: dict[str, asyncio.Lock] = {}
        self._guest_ip_counts: dict[str, int] = {}
        self._guest_ws_to_ip: dict[str, str] = {}

    def try_register_guest_ip(self, ws_id: str, ip: str, limit: int) -> bool:
        """
        Tries to reserve one guest WebSocket slot for a source IP.

        Returns:
            bool: True if slot reserved, False if limit reached
        """
        if limit <= 0:
            return False

        current = self._guest_ip_counts.get(ip, 0)
        if current >= limit:
            return False
        self._guest_ip_counts[ip] = current + 1
        self._guest_ws_to_ip[ws_id] = ip
        return True

    def unregister_guest_ip(self, ws_id: str):
        """Releases a previously reserved guest WebSocket slot by ws_id."""
        ip = self._guest_ws_to_ip.pop(ws_id, None)
        if not ip:
            return
        current = self._guest_ip_counts.get(ip, 0)
        if current <= 1:
            self._guest_ip_counts.pop(ip, None)
        else:
            self._guest_ip_counts[ip] = current - 1

    async def handle_connection(self, websocket: WebSocket, ws_id: str):
        """
        Accept connection and replace any existing socket for this ID.
        "{user_id}.{unique_suffix}" is the expected format for ws_id.
        Stores the WebSocket in active_sockets and maps user_id to ws_id in active_users.

        Args:
            websocket (WebSocket): The WebSocket connection to manage
            ws_id (str): Unique identifier for the WebSocket connection
        Returns:
            str: The WebSocket ID
        """
        await websocket.accept()
        await self._clear_old_socket(ws_id)
        self.active_sockets[ws_id] = websocket
        self.active_users[ws_id.split(".")[0]] = ws_id
        if ws_id not in self.send_locks:
            self.send_locks[ws_id] = asyncio.Lock()
        return ws_id

    async def receive_message(self, ws_id: str) -> dict | None:
        """
        Receives a JSON message from the specified WebSocket.
        Args:
            ws_id (str): Unique identifier for the WebSocket connection
        Returns:
            (dict | None): The received message or None if an error occurs
        Raises:
            WebSocketDisconnect: If the WebSocket is disconnected
        """
        socket = self.active_sockets.get(ws_id)
        if socket:
            try:
                data = await socket.receive_json()
                return data
            except WebSocketDisconnect as e:
                raise e
            except Exception:
                logger.error(
                    f"Unexpected error receiving message from WebSocket: {ws_id}"
                )
        return None

    async def send_message(self, ws_id: str, message: dict):
        """
        Sends a JSON message to the specified WebSocket.


        Args:
            ws_id (str): Unique identifier for the WebSocket connection
            message (dict): The message to send
        Raises:
            WebSocketDisconnect: If the WebSocket is disconnected

        """
        socket = self.active_sockets.get(ws_id)
        if socket:
            try:

                async with self.send_locks[ws_id]:
                    message["time"] = str(datetime.datetime.now())
                    await asyncio.wait_for(socket.send_json(message), timeout=2.0)
            except asyncio.TimeoutError:
                logger.debug(f"Send timeout for {ws_id} - assuming disconnected")
                raise WebSocketDisconnect(3008)
            except WebSocketDisconnect:
                raise
            except Exception:
                logger.error(f"Unexpected error sending message to WebSocket: {ws_id}")
        else:
            logger.debug(f"No active WebSocket found for ID: {ws_id}")

    async def _clear_old_socket(self, ws_id: str):
        """
        Closes any existing WebSocket connection for the user.
        Extracts user_id from ws_id and closes associated WebSocket.
        """
        old_socket_id = self.active_users.get(ws_id.split(".")[0])
        if old_socket_id:
            logger.debug(
                f"User already connected with ID: {old_socket_id}, removing old connection"
            )
            old_socket = self.active_sockets.get(old_socket_id)
            if old_socket:
                try:
                    logger.debug(f"Closing old WebSocket connection: {old_socket_id}")
                    await old_socket.close()
                except Exception:
                    logger.error(f"Error closing old WebSocket: {old_socket_id}")
            else:
                logger.debug(
                    f"(BIG PROBLEM)No active WebSocket found for ID: {old_socket_id}"
                )
        else:
            logger.debug(f"No existing WebSocket to clear for user with ID: {ws_id}")

    def remove_socket_and_lock(self, ws_id: str):
        """
        Clean up socket and associated send lock.
        Args:
            ws_id (str): Unique identifier for the WebSocket connection
        """
        self.active_sockets.pop(ws_id, None)
        self.send_locks.pop(ws_id, None)

    def remove_user(self, user_id: str, ws_id: str):
        """
        Clean up user mapping.

        Only if the mapping points to the given ws_id,
        the user can connect from multiple origins, on the old websocket a
        disconnect will be sent, and this function called, but we should not remove
        the mapping if it was updated to a new ws_id in the meantime.
        """
        ws = self.active_users.get(user_id)
        if ws == ws_id:
            self.active_users.pop(user_id, None)

    async def full_cleanup(self):
        """
        Closes all active WebSocket connections and clears internal state.
        """
        if not self.active_sockets:
            logger.info("[WEBSOCKET] No active connections to clean up")
            self.active_users.clear()
            self.send_locks.clear()
            self._guest_ip_counts.clear()
            self._guest_ws_to_ip.clear()
            return

        logger.info(
            f"[WEBSOCKET] Cleaning up {len(self.active_sockets)} connections..."
        )

        close_tasks = [
            self._close_socket(ws_id, socket)
            for ws_id, socket in self.active_sockets.items()
        ]

        if close_tasks:
            try:
                await asyncio.wait_for(
                    asyncio.gather(*close_tasks, return_exceptions=True), timeout=2.0
                )
            except asyncio.TimeoutError:
                logger.warning(
                    "[WEBSOCKET] Cleanup timeout - some connections may not have closed"
                )
            except Exception as e:
                logger.error(f"[WEBSOCKET] Error during cleanup: {e}")
        self.active_sockets.clear()
        self.active_users.clear()
        self.send_locks.clear()
        self._guest_ip_counts.clear()
        self._guest_ws_to_ip.clear()
        logger.info("[WEBSOCKET] Cleanup completed")

    async def _close_socket(self, ws_id: str, socket: WebSocket):
        """
        Helper to close a single WebSocket connection with timeout handling.
        Args:
            ws_id (str): Unique identifier for the WebSocket connection
            socket (WebSocket): The WebSocket connection to close
        """
        try:
            await asyncio.wait_for(socket.close(), timeout=0.5)
            logger.debug(f"[WEBSOCKET] Closed connection: {ws_id}")
        except asyncio.TimeoutError:
            logger.warning(f"[WEBSOCKET] Timeout closing connection: {ws_id}")
        except Exception as e:
            logger.error(f"[WEBSOCKET] Error closing connection {ws_id}: {e}")

    def get_websocket_id(self, user_id: str) -> str | None:
        return self.active_users.get(user_id, None)


ws_manager: WebSocketManager = WebSocketManager.get_instance()
