import asyncio
from fastapi import (
    APIRouter,
    Request,
    WebSocketDisconnect,
    WebSocket,
    Response,
)
from app.game.player import Player
import uuid
from app.core.dependencies import (
    BotTaskManagerDep,
    GameManagerDep,
    GuestOrUserDep,
    PlayerFactoryDep,
    WebSocketManagerDep,
    rate_limiter,
    BotTaskManager,
    GameSessionManager,
    WebSocketManager,
)
from app.schemas import GameConfigCreate, GameConfigUpdate
from app.schemas.game import GameState
from app.core.logger import AppLogger
from app.core.config import config

logger = AppLogger(__name__)

router = APIRouter()


@router.get("/default_players", response_model=dict)
@rate_limiter("60/minute")
async def get_default_players(
    request: Request,
    response: Response,
    factory: PlayerFactoryDep,
):
    """
    Endpoint that retrieves available default players.
    If database access fails, only random, minimax, and human players are returned.

    Args:
        request (Request): FastAPI request object for rate limiting
        response (Response): FastAPI response object for setting headers
        factory (PlayerFactory): Player factory instance (injected via PlayerFactoryDep)
    Returns:
        dict: Dictionary containing default player configurations

    Raises:
        HTTPException: 500 if default players cannot be loaded from database
    """
    players_generated: list[Player | None] = []
    def_players_names = [
        "menace",
        "backprop_nn",
        "genetic_nn",
        "random",
        "minimax",
        "human",
    ]

    for p in def_players_names:
        players_generated.append(await factory.create_player(p))
    players = list(filter(None, players_generated))
    default_players = {}
    for p in players:
        default_players[p.get_type()] = {
            "id": p.get_id(),
            "name": p.get_name(),
            "type": p.get_type(),
        }

    response.headers["Cache-Control"] = "public, max-age=3600"
    return {"defaultPlayers": default_players}


@router.websocket("/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    user: GuestOrUserDep,
    ws_manager: WebSocketManagerDep,
    game_manager: GameManagerDep,
    bot_manager: BotTaskManagerDep,
):
    """WebSocket endpoint for game interactions"""
    if user and user.id != user_id:
        await websocket.close(code=1008, reason="User ID mismatch")
        return
    random = str(uuid.uuid4())[:10]
    ws_id = user_id + "." + random
    guest_slot_reserved = False

    if user is None and config.get_rate_limit_enabled():
        client_ip = websocket.client.host if websocket.client else None
        if not client_ip:
            await websocket.close(code=1008, reason="Missing client IP")
            return

        allowed = ws_manager.try_register_guest_ip(
            ws_id,
            client_ip,
            config.get_ws_guest_max_connections_per_ip(),
        )
        if not allowed:
            await websocket.close(code=1008, reason="Too many guest connections")
            return
        guest_slot_reserved = True

    try:
        ws_id = await ws_manager.handle_connection(websocket, ws_id)
        await ws_manager.send_message(ws_id, {"message": "Welcome!"})

        while True:
            data = await ws_manager.receive_message(ws_id)
            logger.websocket(f"Received message from {ws_id}: {data}")
            if data is None:
                break
            messages = await _handle_websocket_messages(
                user_id, data, ws_manager, ws_id, game_manager, bot_manager
            )
            for message in messages:
                await ws_manager.send_message(ws_id, message)
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {ws_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket {ws_id}: {e}")
    finally:
        bot_manager.cancel_task(user_id)
        game_manager.connection_lost(user_id)
        ws_manager.remove_socket_and_lock(ws_id)
        ws_manager.remove_user(user_id, ws_id)

        if guest_slot_reserved:
            ws_manager.unregister_guest_ip(ws_id)
        logger.debug(f"Clean up WebSocket connection for {ws_id} completed")


def _new_asyncs(
    auto: bool,
    firstHuman: bool,
    ws_id: str,
    user_id: str,
    ws_manager: WebSocketManager,
    game_manager: GameSessionManager,
    bot_manager: BotTaskManager,
):
    if auto:
        bot_manager.start_task(
            user_id,
            _send_bot_vs_bot_updates(
                ws_manager,
                ws_id,
                user_id,
                game_manager,
            ),
        )
    elif not firstHuman:
        bot_manager.start_task(
            user_id,
            _delayed_bot_move(ws_manager, ws_id, user_id, game_manager),
        )


def _continue_asyncs(
    auto: bool,
    botNext: bool,
    ws_id: str,
    user_id: str,
    ws_manager: WebSocketManager,
    game_manager: GameSessionManager,
    bot_manager: BotTaskManager,
):
    if auto:
        bot_manager.start_task(
            user_id,
            _send_bot_vs_bot_updates(
                ws_manager,
                ws_id,
                user_id,
                game_manager,
            ),
        )
    elif botNext:
        bot_manager.start_task(
            user_id,
            _delayed_bot_move(ws_manager, ws_id, user_id, game_manager),
        )


async def _handle_websocket_messages(
    user_id: str,
    data: dict | None,
    ws_manager: WebSocketManager,
    ws_id: str,
    game_manager: GameSessionManager,
    bot_manager: BotTaskManager,
) -> list[dict]:
    if not data:
        return [{"error": "No valid data received"}]
    type = data.get("type")
    if not type:
        return [{"error": "No message type specified"}]

    if type == "stats":
        return [
            {
                "type": "stats",
                "active_games": len(game_manager.active_sessions),
                "active_sockets": len(ws_manager.active_sockets),
                "active_users": len(ws_manager.active_users),
                "active last_seen": len(game_manager.game_last_seen),
                "active locks": len(ws_manager.send_locks),
            }
        ]
    if type == "new":
        bot_manager.cancel_task(user_id)
        try:
            config = GameConfigCreate.model_validate(data.get("config"))
        except Exception as e:
            return [{"error": f"Invalid config data: {e}"}]
        message = await game_manager.create_game_session(user_id, config)
        if "error" in message or "warning" in message:
            return [message]
        game = game_manager.get_game_strict(user_id)
        _new_asyncs(
            game.auto,
            game.player1.get_type() == "human",
            ws_id,
            user_id,
            ws_manager,
            game_manager,
            bot_manager,
        )
        return [message]
    if type == "update":
        try:
            config = GameConfigUpdate.model_validate(data.get("config"))
        except Exception as e:
            return [{"error": f"Invalid config data: {e}"}]
        message = game_manager.update_game_session(user_id, config)
        return [message]
    if type == "move":
        messages = []
        position = data.get("position")
        if position is None:
            return [{"error": "No position specified"}]
        message = game_manager.process_move(user_id, position, is_user_move=True)
        if "error" in message or "warning" in message:
            return [message]
        messages.append(message)
        new_state = game_manager.get_game_response(user_id)
        if not new_state:
            return [{"warning": "game session no longer active"}]
        messages.append({"type": "state", "state": new_state.model_dump()})
        if game_manager.is_round_ongoing(user_id):
            bot_manager.start_task(
                user_id,
                _delayed_bot_move(ws_manager, ws_id, user_id, game_manager),
            )
        elif game_manager.is_game_finished(user_id):
            finished_state = game_manager.get_game_response(user_id)
            if finished_state:
                messages.append(
                    {
                        "type": "game_over",
                        "state": finished_state.model_dump(),
                    }
                )
        return messages
    if type == "new_round":
        message = game_manager.start_new_round(user_id)
        if "error" in message or "warning" in message:
            return [message]
        new_state = game_manager.get_game_response_strict(user_id)
        game = game_manager.get_game_strict(user_id)

        _new_asyncs(
            game.auto,
            game.player1.get_type() == "human",
            ws_id,
            user_id,
            ws_manager,
            game_manager,
            bot_manager,
        )
        return [message, {"type": "state", "state": new_state.model_dump()}]
    if type == "resume":

        if game_manager.is_game_paused(user_id):
            state = game_manager.get_game_response_strict(user_id)
            settings = game_manager.get_game_settings_strict(user_id)

            return [
                {"type": "resume", "message": "Game resumed"},
                {
                    "type": "config",
                    "state": state.model_dump(),
                    "settings": settings.model_dump(),
                },
            ]
        else:
            game = game_manager.get_game(user_id)
            return [
                {
                    "info": f"No paused games found for user {user_id}, or game not paused {('status: ' + game.status) if game else 'N/A'}"
                }
            ]
    if type == "continue":
        game = game_manager.continue_paused_game(user_id)
        if game:
            _continue_asyncs(
                game.auto,
                (game.player2.get_type() != "human" and game.current_turn == "O")
                or (game.player1.get_type() != "human" and game.current_turn == "X"),
                ws_id,
                user_id,
                ws_manager,
                game_manager,
                bot_manager,
            )
            state = game_manager.get_game_response_strict(user_id)
            return [
                {
                    "type": "continue",
                    "message": "Game continued",
                    "state": state.model_dump(),
                }
            ]
        else:
            return [{"error": "No (paused) game to continue"}]
    return [{"error": "Unknown message type"}]


async def _delayed_bot_move(
    ws_manager: WebSocketManager,
    ws_id: str,
    user_id: str,
    game_manager: GameSessionManager,
):
    try:
        game: GameState | None = game_manager.get_game(user_id)
        if not game:
            logger.debug(f"No active game for {user_id}, skipping delayed bot move")
            return
        move = await game_manager.make_move(user_id)

        await asyncio.sleep(game.player_delay_ms / 1000)

        message = game_manager.process_move(user_id, move, False)
        if "error" in message or "warning" in message:
            logger.debug(f"Error/Warning processing bot move: {message}")
            return
        new_state = game_manager.get_game_response(user_id)
        if not new_state:
            logger.debug(f"Game session ended before state update for {user_id}")
            return

        await ws_manager.send_message(
            ws_id, {"type": "state", "state": new_state.model_dump()}
        )
        if game_manager.is_game_finished(user_id):
            finished_state = game_manager.get_game_response(user_id)
            if not finished_state:
                return
            await ws_manager.send_message(
                ws_id,
                {
                    "type": "game_over",
                    "state": finished_state.model_dump(),
                },
            )
            logger.debug("Game over sent from bot move")
    except asyncio.CancelledError:
        logger.debug(
            f"Bot move for {user_id} cancelled (User disconnected or new game started)"
        )
        raise
    except (WebSocketDisconnect, RuntimeError):
        logger.debug(f"User {user_id} disconnected during bot loop. Stopping task.")
        return
    except Exception as e:
        logger.debug(f"Error sending bot move state update: {e}")
        return


async def _send_bot_vs_bot_updates(
    ws_manager: WebSocketManager,
    ws_id: str,
    user_id: str,
    game_manager: GameSessionManager,
):
    try:
        while True:  # whole game
            if not game_manager.get_game(user_id):
                break
            if game_manager.is_game_finished(user_id):
                break
            while True:  # 1 round
                game = game_manager.get_game(user_id)
                if not game:
                    return
                if not game_manager.is_round_ongoing(user_id):
                    break

                move = await game_manager.make_move(user_id)

                message = game_manager.process_move(user_id, move, False)
                if "error" in message or "warning" in message:
                    logger.debug(f"Error/Warning processing bot move: {message}")
                    return

                new_state = game_manager.get_game_response(user_id)
                if not new_state:
                    return
                await ws_manager.send_message(
                    ws_id, {"type": "state", "state": new_state.model_dump()}
                )

                await asyncio.sleep(game.player_delay_ms / 1000)

            message = game_manager.start_new_round(user_id)
            if "warning" in message:
                logger.debug(f"Warning starting new round: {message}")
                break
            if "error" in message:
                logger.debug(f"Error starting new round: {message}")
                return
            new_state = game_manager.get_game_response(user_id)
            if not new_state:
                return
            await ws_manager.send_message(
                ws_id, {"type": "new_round", "state": new_state.model_dump()}
            )
            await asyncio.sleep(game.round_delay_ms / 1000)

        final_state = game_manager.get_game_response(user_id)
        if not final_state:
            return
        await ws_manager.send_message(
            ws_id,
            {
                "type": "game_over",
                "state": final_state.model_dump(),
            },
        )
    except asyncio.CancelledError:
        logger.debug(f"Bot task for {user_id} was cancelled.")
        raise
    except (WebSocketDisconnect, RuntimeError):
        logger.debug(f"User {user_id} disconnected during bot loop. Stopping task.")
        return
    except Exception as e:
        logger.exception(f"Unexpected crash in bot loop for {user_id}: {e}")
