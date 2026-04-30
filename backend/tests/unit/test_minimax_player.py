import pytest
from app.game.players.minimax import MinimaxPlayer


@pytest.fixture(autouse=True)
def reset_shared_player_state():
    MinimaxPlayer._move_cache.clear()
    yield
    MinimaxPlayer._move_cache.clear()


class TestMinimaxPlayer:

    def test_minimax_player_initialization(self):
        player = MinimaxPlayer()
        assert player.get_name() == "Minimax"
        assert player.get_type() == "minimax"
        assert player.get_id() == "MinimaxID"

    BOARD_CASES = [
        (["X", "X", None, "O", "O", None, None, None, None], [2], "winning_minimax"),
        (
            ["X", None, None, "O", "O", None, "X", None, None],
            [5],
            "blocking_enemy_win_minimax",
        ),
        (
            [None, None, None, None, None, None, None, None, None],
            [0, 2, 4, 6, 8],
            "first_move_minimax",
        ),
        (["X", "O", "X", "O", "X", "X", "O", "X", "O"], [-1], "full_board_minimax"),
    ]

    @pytest.mark.parametrize(
        "board, expected_moves",
        [case[:2] for case in BOARD_CASES],
        ids=[case[2] for case in BOARD_CASES],
    )
    async def test_minimax_move(self, board, expected_moves):
        player = MinimaxPlayer()
        try:
            move = await player.get_move(board)
        except ValueError:
            move = -1
        assert move in expected_moves

    async def test_minimax_cache(self):
        player = MinimaxPlayer()
        board: list[str | None] = [None, "O", None, "X", None, None, None, None, None]
        move = await player.get_move(board)
        assert MinimaxPlayer._move_cache.get(tuple(board)) == move

    async def test_minimax_start_move(self):
        player = MinimaxPlayer()
        MinimaxPlayer._optimal_openings = [10]
        board: list[str | None] = [None, None, None, None, None, None, None, None, None]
        move = await player.get_move(board)
        assert move == 10

    async def test_minimax_move_cache_reuses_previous_result(self, monkeypatch):
        player = MinimaxPlayer()
        board: list[str | None] = [None, "X", None, None, None, None, None, None, None]
        calls = {"count": 0}

        async def fake_compute_move(current_board, empty_spaces):
            calls["count"] += 1
            return 4

        monkeypatch.setattr(player, "_compute_move", fake_compute_move)

        first_move = await player.get_move(board)
        second_move = await player.get_move(board)

        assert first_move == 4
        assert second_move == 4
        assert calls["count"] == 1
        assert tuple(board) in MinimaxPlayer._move_cache
