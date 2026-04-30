import pytest
from app.utils.menace import (
    canonical,
    all_symmetries,
    choose_weighted_move,
    winner_of,
    is_terminal,
    generate_ongoing_canonical_positions,
    init_menace_data,
    canonical_with_map,
)


class TestMenace:

    BOARD_CASES = [
        ("_________", "_________"),
        ("X________", "X________"),
        ("_X_______", "_X_______"),
        ("__X______", "X________"),
        ("___X_____", "_X_______"),
        ("____X____", "____X____"),
        ("_____X___", "_X_______"),
        ("______X__", "X________"),
        ("_______X_", "_X_______"),
        ("________X", "X________"),
    ]

    @pytest.mark.parametrize("board,expected_board", BOARD_CASES)
    def test_canonical_boards(self, board, expected_board):
        result = canonical(board)
        assert result == expected_board

    def test_all_symmetries_generates_8(self):
        board_str = "XO___X___"
        symmetries = list(all_symmetries(board_str))

        assert len(symmetries) == 8
        assert all(len(s) == 9 for s in symmetries)

    def test_choose_weighted_move(self):
        moves = {0: 5, 1: 0, 2: 2}
        move = choose_weighted_move(moves)

        assert move in [0, 2]

    def test_choose_weighted_move_empty(self):
        moves = {}
        result = choose_weighted_move(moves)

        assert result is None

    WIN_CASES = [
        ("XXX______", "X", "horizontal_top_X"),
        ("___OOO___", "O", "horizontal_middle_O"),
        ("X__X__X__", "X", "vertical_left_X"),
        ("_O__O__O_", "O", "vertical_middle_O"),
        ("X___X___X", "X", "vertical_right_X"),
        ("______OOO", "O", "horizontal_bottom_O"),
        ("X___X___X", "X", "diagonal_X"),
        ("__O_O_O__", "O", "diagonal_O"),
        ("XXO______", None, "draw"),
    ]

    @pytest.mark.parametrize(
        "board,expected_winner",
        [case[:2] for case in WIN_CASES],
        ids=[case[2] for case in WIN_CASES],
    )
    def test_winner_of(self, board, expected_winner):
        result = winner_of(board)
        assert result == expected_winner

    @pytest.mark.parametrize(
        "board,expected",
        [
            ("XXX______", True),
            ("___OOO___", True),
            ("X__X__X__", True),
            ("_O__O__O_", True),
            ("X___X___X", True),
            ("______OOO", True),
            ("X___X___X", True),
            ("__O_O_O__", True),
            ("XXO______", False),
            ("XO_______", False),
            ("XOXOXOXOX", True),
            ("XXOOOXXXO", True),
            ("_________", False),
        ],
    )
    def test_is_terminal(self, board, expected):
        result = is_terminal(board)
        assert result == expected

    def test_generate_ongoing_canonical_positions(self):
        positions = generate_ongoing_canonical_positions()

        assert len(positions) == 627
        assert all(isinstance(p, str) for p in positions)
        assert all(len(p) == 9 for p in positions)
        assert all(not is_terminal(p) for p in positions)

    def test_init_menace_data(self):
        matchboxes = init_menace_data(base_beads=3)

        assert isinstance(matchboxes, dict)
        assert len(matchboxes) == 627

        for state, moves in matchboxes.items():
            assert isinstance(state, str)
            assert len(state) == 9
            assert isinstance(moves, dict)
            assert all(count == 3 for count in moves.values())

    def test_canonical_with_map(self):
        board_str = "X______OX"
        canon_str, transform_map = canonical_with_map(board_str)

        assert isinstance(canon_str, str)
        assert len(canon_str) == 9
        assert isinstance(transform_map, tuple)
        assert len(transform_map) == 9

    def test_symmetries_produce_same_canonical(self):
        board1 = "X________"
        board2 = "_______X_"
        board3 = "________X"

        canon1 = canonical(board1)
        canon2 = canonical(board2)
        canon3 = canonical(board3)

        assert isinstance(canon1, str)
        assert isinstance(canon2, str)
        assert isinstance(canon3, str)
        assert len(canon1) == 9
        assert len(canon2) == 9
        assert len(canon3) == 9
        assert canon1 == canon3
        assert canon1 != canon2
