from app.schemas import (
    GameResponse,
    GameConfigCreate,
    GameSettings,
    GameConfigUpdate,
    PlayerItem,
)
from app.schemas.game import GameState
from app.services.singleton import Singleton
from ..player_factory import player_factory
from app.core.logger import AppLogger
from functools import wraps
from datetime import datetime


class GameStateNotFoundError(Exception):
    """Raised when a game state is required but not found."""

    pass


class GameSettingsNotFoundError(Exception):
    """Raised when a game settings is required but not found."""

    pass


class GameResponseNotFoundError(Exception):
    """Raised when a game response is required but not found."""

    pass


logger = AppLogger(__name__)

# TODO: consider a separate Game class to encapsulate game logic and state
# like GameState but with methods for like is_finished, make_move, check_winner, etc. GameSessionManager would then manage Game instances instead of raw GameState dicts
# and delegate game logic to the Game class. This could help clean up some of the logic in GameSessionManager and make it more focused on session management rather than game rules.


class GameSessionManager(metaclass=Singleton):
    STATUS_ONGOING = "ongoing"
    STATUS_FINISHED = "finished"
    PAUSED_PREFIX = "paused "
    ROUND_END_STATUSES = ("X_won", "O_won", "draw")

    @staticmethod
    def require_active_game(missing_return=None, touch_last_seen=True):
        def decorate(fn):
            @wraps(fn)
            def wrapper(self, user_id, *args, **kwargs):
                game = self.active_sessions.get(user_id)
                if not game:
                    return missing_return
                if touch_last_seen:
                    self._last_seen(user_id)
                return fn(self, user_id, *args, **kwargs)

            return wrapper

        return decorate

    def __init__(self):
        # websocket : user_id : GameState, 1:1:1 mapping,
        # a given dict item won't be accessed by multiple threads / coroutines simultaneously
        self.active_sessions: dict[str, GameState] = {}
        self.game_last_seen: dict[str, datetime] = {}

    async def create_game_session(self, user_id: str, config: GameConfigCreate):
        if config.rounds > 1000:
            return {"error": "rounds cannot be greater than 1000"}
        if config.player_delay_ms > 10000 or config.round_delay_ms > 10000:
            return {"error": "delays cannot be greater than 10000 ms (10 seconds)"}
        if config.player1.type == "human" and config.player2.type == "human":
            return {"error": "cannot have two human players"}
        if (
            config.player1.type != "human"
            and config.player2.type != "human"
            and not config.auto
        ):
            return {"error": "at least one player must be human if auto is false"}

        p1 = await player_factory.create_player(
            config.player1.type, config.player1.name, config.player1.id
        )
        p2 = await player_factory.create_player(
            config.player2.type, config.player2.name, config.player2.id
        )
        if not p1 or not p2:
            return {"error": "invalid player type(s) / error creating player(s)"}

        state = GameState(
            rounds=max(config.rounds or 1, 1),
            player_delay_ms=max(config.player_delay_ms or 1000, 20),
            round_delay_ms=max(config.round_delay_ms or 1000, 20),
            auto=bool(config.auto),
            player1=p1,
            player2=p2,
        )

        self.active_sessions[user_id] = state
        self._last_seen(user_id)

        return {
            "type": "game_created",
            "settings": self.get_game_settings_strict(user_id).model_dump(),
            "state": self.get_game_response_strict(user_id).model_dump(),
        }

    @require_active_game(missing_return={"error": "no active game session"})
    def update_game_session(self, user_id: str, config: GameConfigUpdate):
        game = self.get_game_strict(user_id)
        if game.status == GameSessionManager.STATUS_FINISHED or (
            game.curr_round >= game.rounds
            and GameSessionManager.STATUS_ONGOING != game.status
        ):
            return {"error": "cannot update finished game, start a new one"}

        game.rounds = (
            config.rounds
            if config.rounds and config.rounds > game.curr_round
            else game.rounds
        )
        game.player_delay_ms = (
            config.player_delay_ms
            if config.player_delay_ms is not None
            else game.player_delay_ms
        )
        game.round_delay_ms = (
            config.round_delay_ms
            if config.round_delay_ms is not None
            else game.round_delay_ms
        )

        return {
            "type": "game_updated",
            "settings": self.get_game_settings_strict(user_id).model_dump(),
            "state": self.get_game_response_strict(user_id).model_dump(),
        }

    @require_active_game(missing_return={"error": "no active game session"})
    def start_new_round(self, user_id: str):
        game = self.get_game_strict(user_id)

        if game.status == GameSessionManager.STATUS_FINISHED:
            return {"warning": "game already finished"}
        if game.status not in GameSessionManager.ROUND_END_STATUSES:
            return {"warning": "current round not over"}

        if game.curr_round >= game.rounds:
            game.status = GameSessionManager.STATUS_FINISHED
            return {"status": "all rounds completed"}

        empty_board: list[list[str | None]] = [[None] * 3 for _ in range(3)]
        game.board = empty_board
        game.current_turn = "X"
        game.status = self.STATUS_ONGOING
        game.curr_round += 1

        return {"status": "new round started", "curr_round": game.curr_round}

    @require_active_game(missing_return={"error": "no active game session"})
    def process_move(
        self,
        user_id: str,
        position: int,
        is_user_move: bool,
    ):
        game = self.get_game_strict(user_id)
        if not isinstance(position, int) or position not in range(9):
            return {"warning": "invalid position"}
        if game.status != GameSessionManager.STATUS_ONGOING:
            return {"warning": "round over or game inactive"}

        if is_user_move:
            if not (
                (game.player1.get_type() == "human" and game.current_turn == "X")
                or (game.player2.get_type() == "human" and game.current_turn == "O")
            ):
                return {"warning": "not your turn"}

        row, col = divmod(position, 3)
        if game.board[row][col] is not None:
            return {"warning": "position already taken"}

        game.board[row][col] = game.current_turn
        game.current_turn = "O" if game.current_turn == "X" else "X"

        winner = self._check_winner(game.board)
        if winner:
            game.status = f"{winner}_won"
            if winner == "X":
                game.x_wins += 1
            else:
                game.o_wins += 1
        elif all(cell is not None for row in game.board for cell in row):
            game.status = "draw"
            game.draws += 1

        return {"status": "move processed", "position": position}

    async def make_move(self, user_id: str):
        game = self.get_game(user_id)
        if not game or game.status != GameSessionManager.STATUS_ONGOING:
            return -1

        board = [cell for row in game.board for cell in row]
        player = game.player1 if game.current_turn == "X" else game.player2
        try:
            return await player.get_move(board)
        except Exception as e:
            logger.error(f"Error getting move from player {player.get_name()}: {e}")
            return -1

    @require_active_game(missing_return=None)
    def connection_lost(self, user_id: str):
        game = self.get_game_strict(user_id)
        if game.status != GameSessionManager.STATUS_FINISHED:
            if not self._is_paused_status(game.status):
                game.status = f"{GameSessionManager.PAUSED_PREFIX}{game.status}"
        else:
            self._end_game_session(user_id)
            self.game_last_seen.pop(user_id, None)

    @require_active_game(missing_return=None)
    def continue_paused_game(self, user_id: str):
        game = self.get_game_strict(user_id)
        if not self._is_paused_status(game.status):
            return None
        game.status = self._strip_paused_status(game.status)
        return game

    @require_active_game(missing_return=None)
    def get_game_response(self, user_id: str) -> GameResponse | None:
        game = self.get_game_strict(user_id)
        return GameResponse(
            **game.model_dump(
                include={"board", "current_turn", "status", "curr_round", "rounds"}
            ),
            x_o_draw={"X": game.x_wins, "O": game.o_wins, "draw": game.draws},
        )

    def get_game_response_strict(self, user_id: str):
        response = self.get_game_response(user_id)
        if not response:
            raise GameResponseNotFoundError(f"No active game response for {user_id}")
        return response

    @require_active_game(missing_return=None)
    def get_game_settings(self, user_id: str):
        game = self.get_game_strict(user_id)
        return GameSettings(
            **game.model_dump(
                include={"player_delay_ms", "round_delay_ms", "auto", "rounds"}
            ),
            player1=PlayerItem(
                id=game.player1.get_id(),
                type=game.player1.get_type(),
                name=game.player1.get_name(),
            ),
            player2=PlayerItem(
                id=game.player2.get_id(),
                type=game.player2.get_type(),
                name=game.player2.get_name(),
            ),
        )

    def get_game_settings_strict(self, user_id: str):
        settings = self.get_game_settings(user_id)
        if not settings:
            raise GameSettingsNotFoundError(f"No active game settings for {user_id}")
        return settings

    @require_active_game(missing_return=None)
    def get_game(self, user_id: str) -> GameState | None:
        return self.active_sessions.get(user_id)

    def get_game_strict(self, user_id: str) -> GameState:
        game = self.get_game(user_id)
        if not game:
            raise GameStateNotFoundError(f"No active game session for user {user_id}")
        return game

    @require_active_game(missing_return=False)
    def is_game_finished(self, user_id: str) -> bool:
        game = self.get_game_strict(user_id)
        return self._sync_finished_state(game)

    @require_active_game(missing_return=False)
    def is_game_paused(self, user_id: str) -> bool:
        game = self.get_game_strict(user_id)
        return self._is_paused_status(game.status)

    @require_active_game(missing_return=False)
    def is_round_ongoing(self, user_id: str) -> bool:
        game = self.get_game_strict(user_id)
        return game.status == self.STATUS_ONGOING

    async def partial_cleanup(self, inactivity_timeout_seconds: int = 450):
        self._prune_inactive_sessions(inactivity_timeout_seconds)

    def _last_seen(self, user_id: str):
        if user_id in self.active_sessions:
            self.game_last_seen[user_id] = datetime.now()

    def _end_game_session(self, user_id: str):
        popped = self.active_sessions.pop(user_id, None)
        return popped is not None

    def _prune_inactive_sessions(self, timeout_seconds: int):
        now = datetime.now()
        expired = [
            uid
            for uid, ts in self.game_last_seen.items()
            if (now - ts).total_seconds() > timeout_seconds
        ]
        for uid in expired:
            self._end_game_session(uid)
            self.game_last_seen.pop(uid, None)
        return len(expired)

    def _sync_finished_state(self, game: GameState) -> bool:
        if game.status == GameSessionManager.STATUS_FINISHED:
            return True
        if (
            game.curr_round >= game.rounds
            and game.status in GameSessionManager.ROUND_END_STATUSES
        ):
            game.status = GameSessionManager.STATUS_FINISHED
            return True
        return False

    def _is_paused_status(self, status: str) -> bool:
        return status.startswith(GameSessionManager.PAUSED_PREFIX)

    def _strip_paused_status(self, status: str) -> str:
        if not self._is_paused_status(status):
            return status
        return status[len(GameSessionManager.PAUSED_PREFIX) :]

    def _check_winner(self, board):
        for i in range(3):
            if board[i][0] and board[i][0] == board[i][1] == board[i][2]:
                return board[i][0]
            if board[0][i] and board[0][i] == board[1][i] == board[2][i]:
                return board[0][i]
        if board[0][0] and board[0][0] == board[1][1] == board[2][2]:
            return board[0][0]
        if board[0][2] and board[0][2] == board[1][1] == board[2][0]:
            return board[0][2]
        return None


game_manager: GameSessionManager = GameSessionManager.get_instance()
