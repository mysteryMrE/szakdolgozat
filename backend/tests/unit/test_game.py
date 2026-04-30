import pytest
from datetime import datetime, timedelta
from app.services.managers.game_manager import GameSessionManager
from app.schemas import GameConfigCreate, PlayerItem
from app.schemas.game import GameState


class TestGame:

    async def _create_session(self, game_manager: GameSessionManager, user_id: str):
        config = GameConfigCreate(
            player1=PlayerItem(id="p1", type="human", name="User"),
            player2=PlayerItem(id="p2", type="random", name="Bot"),
            player_delay_ms=20,
            round_delay_ms=20,
            auto=False,
            rounds=1,
        )
        result = await game_manager.create_game_session(user_id, config)
        assert "error" not in result

    WINNER_TEST_CASES = [
        (
            [["X", "X", "X"], [None, None, None], [None, None, None]],
            "X",
            "horizontal_top_X",
        ),
        (
            [[None, None, None], ["O", "O", "O"], [None, None, None]],
            "O",
            "horizontal_middle_O",
        ),
        (
            [["X", "O", None], ["X", "O", None], ["X", None, None]],
            "X",
            "vertical_left_X",
        ),
        (
            [[None, "O", None], [None, "O", None], [None, "O", "X"]],
            "O",
            "vertical_middle_O",
        ),
        (
            [["O", "X", None], [None, "O", "X"], [None, None, "O"]],
            "O",
            "diagonal_top_left_O",
        ),
        (
            [["X", "O", "X"], [None, "X", "O"], ["X", None, "O"]],
            "X",
            "diagonal_top_right_X",
        ),
        (
            [["X", "O", None], [None, None, None], [None, None, None]],
            None,
            "no_winner_ongoing",
        ),
        ([["X", "O", "X"], ["O", "X", "O"], ["O", "X", "O"]], None, "no_winner_draw"),
    ]

    @pytest.mark.parametrize(
        "board, expected_winner",
        [case[:2] for case in WINNER_TEST_CASES],
        ids=[case[2] for case in WINNER_TEST_CASES],
    )
    def test_check_winner(
        self, board, expected_winner, game_manager: GameSessionManager
    ):
        winner = game_manager._check_winner(board)

        assert winner == expected_winner

    def test_process_move_valid_first_move(self, game_manager: GameSessionManager):
        result = game_manager.process_move("nonexistent_user", 0, True)
        assert "error" in result
        assert result["error"] == "no active game session"

    def test_process_move_invalid_position_negative(
        self, game_manager: GameSessionManager
    ):
        result = game_manager.process_move("user123", -1, True)
        assert "error" in result or "warning" in result

    def test_process_move_invalid_position_too_large(
        self, game_manager: GameSessionManager
    ):
        result = game_manager.process_move("user123", 9, True)
        assert "error" in result or "warning" in result

    def test_end_game_session_nonexistent(self, game_manager: GameSessionManager):
        result = game_manager._end_game_session("nonexistent_user")
        assert result is False

    def test_get_game_nonexistent(self, game_manager: GameSessionManager):
        game = game_manager.get_game("nonexistent_user")
        assert game is None

    def test_get_game_response_nonexistent(self, game_manager: GameSessionManager):
        response = game_manager.get_game_response("nonexistent_user")
        assert response is None

    def test_get_game_settings_nonexistent(self, game_manager: GameSessionManager):
        settings = game_manager.get_game_settings("nonexistent_user")
        assert settings is None

    def test_start_new_round_no_session(self, game_manager: GameSessionManager):
        result = game_manager.start_new_round("nonexistent_user")
        assert "error" in result
        assert result["error"] == "no active game session"

    async def test_make_move_no_game(self, game_manager: GameSessionManager):
        move = await game_manager.make_move("nonexistent_user")
        assert move == -1

    def test_manager_initialization(self, game_manager: GameSessionManager):
        assert game_manager.active_sessions == {}
        assert game_manager.game_last_seen == {}

    def test_connection_lost_silent_for_nonexistent_user(
        self, game_manager: GameSessionManager
    ):
        game_manager.connection_lost("user123")
        assert game_manager.active_sessions.get("user123") is None

    def test_last_seen_no_session(self, game_manager: GameSessionManager):
        game_manager._last_seen("nonexistent_user")
        assert "nonexistent_user" not in game_manager.game_last_seen

    POSITION_CASES = [
        (0, 0, 0, "top-left"),
        (1, 0, 1, "top-middle"),
        (2, 0, 2, "top-right"),
        (3, 1, 0, "middle-left"),
        (4, 1, 1, "middle"),
        (5, 1, 2, "middle-right"),
        (6, 2, 0, "bottom-left"),
        (7, 2, 1, "bottom-middle"),
        (8, 2, 2, "bottom-right"),
    ]

    @pytest.mark.parametrize(
        "position,expected_row,expected_col",
        [case[:3] for case in POSITION_CASES],
        ids=[case[3] for case in POSITION_CASES],
    )
    def test_position_to_coordinates(self, position, expected_row, expected_col):
        row, col = divmod(position, 3)
        assert row == expected_row
        assert col == expected_col

    async def test_process_move_not_your_turn_bot_vs_bot(
        self, game_manager: GameSessionManager
    ):
        config = GameConfigCreate(
            player1=PlayerItem(id="p1", type="minimax", name="Mini"),
            player2=PlayerItem(id="p2", type="random", name="Bot"),
            player_delay_ms=20,
            round_delay_ms=20,
            auto=True,
            rounds=1,
        )
        created = await game_manager.create_game_session("bot_user", config)
        assert "error" not in created

        result = game_manager.process_move("bot_user", 0, True)
        assert result == {"warning": "not your turn"}

    async def test_process_move_position_already_taken(
        self, game_manager: GameSessionManager
    ):
        await self._create_session(game_manager, "taken_user")

        first = game_manager.process_move("taken_user", 0, True)
        assert first["status"] == "move processed"

        second = game_manager.process_move("taken_user", 0, False)
        assert second == {"warning": "position already taken"}

    async def test_start_new_round_completes_game_after_last_round(
        self, game_manager: GameSessionManager
    ):
        await self._create_session(game_manager, "round_user")
        game = game_manager.get_game("round_user")
        assert game is not None

        game.status = "draw"
        game.curr_round = game.rounds

        result = game_manager.start_new_round("round_user")
        assert result == {"status": "all rounds completed"}
        assert game.status == "finished"

    async def test_connection_lost_finished_game_removes_session(
        self, game_manager: GameSessionManager
    ):
        await self._create_session(game_manager, "finished_user")
        game = game_manager.get_game("finished_user")
        assert game is not None
        game.status = "finished"

        game_manager.connection_lost("finished_user")

        assert game_manager.get_game("finished_user") is None
        assert "finished_user" not in game_manager.game_last_seen

    @pytest.mark.parametrize(
        "status",
        ["ongoing", "draw", "X_won", "O_won"],
        ids=["ongoing", "draw", "X_won", "O_won"],
    )
    async def test_connection_lost_nonfinished_game_keeps_session(
        self, status, game_manager: GameSessionManager
    ):
        await self._create_session(game_manager, "not_finished_user")
        game = game_manager.get_game("not_finished_user")
        assert game is not None
        game.status = status

        game_manager.connection_lost("not_finished_user")

        assert game_manager.get_game("not_finished_user") is not None
        assert "not_finished_user" in game_manager.game_last_seen
        assert (
            game_manager.active_sessions["not_finished_user"].status
            == f"paused {status}"
        )

    async def test_prune_inactive_sessions_removes_timed_out_session(
        self, game_manager: GameSessionManager
    ):
        await self._create_session(game_manager, "idle_user")
        game_manager.game_last_seen["idle_user"] = datetime.now() - timedelta(
            seconds=120
        )

        await game_manager.partial_cleanup(30)

        assert game_manager.get_game("idle_user") is None
        assert "idle_user" not in game_manager.game_last_seen
