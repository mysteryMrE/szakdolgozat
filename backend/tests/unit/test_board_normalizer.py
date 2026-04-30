import pytest

from app.utils import board_to_list, board_to_str


class TestBoardNormalizerValidInputs:

    @pytest.mark.parametrize(
        "board, expected",
        [
            ("XOX_OX___", "XOX_OX___"),
            ("xox ox   ", "XOX_OX___"),
            (["X", "O", "X", None, "O", "X", None, None, None], "XOX_OX___"),
            (("X", "O", "X", " ", "O", "X", " ", "", None), "XOX_OX___"),
            (
                [["X", "O", "X"], [None, "O", "X"], [None, " ", ""]],
                "XOX_OX___",
            ),
            (
                (("X", "O", "X"), [None, "O", "X"], (None, " ", "")),
                "XOX_OX___",
            ),
        ],
        ids=[
            "already_normalized_str",
            "str_lowercase_and_spaces",
            "flat_list_with_none",
            "flat_tuple_with_space_and_empty",
            "nested_3x3_list",
            "nested_3x3_mixed_tuple_list",
        ],
    )
    def test_board_to_str_supported_representations(self, board, expected):
        assert board_to_str(board) == expected

    def test_board_to_list_converts_underscores_to_none(self):
        board = "XOX_OX___"
        assert board_to_list(board) == ["X", "O", "X", None, "O", "X", None, None, None]


class TestBoardNormalizerBadInputs:

    @pytest.mark.parametrize(
        "board",
        [
            123,
            12.5,
            {"X", "O"},
            object(),
        ],
        ids=["int", "float", "set", "object"],
    )
    def test_unsupported_type(self, board):
        with pytest.raises(TypeError, match="Unsupported board type"):
            board_to_str(board)

    @pytest.mark.parametrize(
        "board",
        [
            ["X", "O"],
            [["X", "O", "X"], ["O", "X", "O"]],
            [["X", "O"], ["X", "O"], ["X", "O"]],
            [["X", "O", "X"], "O", "X", "O", "X", "O", "_"],
        ],
        ids=[
            "flat_wrong_length",
            "nested_missing_row",
            "nested_wrong_row_size",
            "nested_mixed_wrong",
        ],
    )
    def test_unsupported_list_shape(self, board):
        with pytest.raises(ValueError, match="Unsupported list board shape"):
            board_to_str(board)

    @pytest.mark.parametrize(
        "board",
        [
            "XAZ______",
            ["X", "O", "A", None, None, None, None, None, None],
            ["X", "O", 1, None, None, None, None, None, None],
        ],
        ids=["invalid_char_in_string", "invalid_char_in_list", "invalid_int_in_list"],
    )
    def test_invalid_symbols(self, board):
        with pytest.raises(ValueError, match="unsupported board cell"):
            board_to_str(board)

    @pytest.mark.parametrize(
        "board",
        [
            "XOX",
            "XOX_OX____",
        ],
        ids=["too_short_string", "too_long_string"],
    )
    def test_invalid_length(self, board):
        with pytest.raises(ValueError, match="board length must be 9"):
            board_to_str(board)
