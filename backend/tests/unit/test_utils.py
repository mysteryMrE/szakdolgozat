import pytest
from app.utils import encode_board_for_nn


class TestBoardEncoding:

    BOARD_CASES = [
        ("_________", [0] * 18, "empty_board_encoding"),
        (
            "XOX______",
            [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            "mixed_board_encoding",
        ),
        (
            "XXOOOXXXO",
            [1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1],
            "full_board_encoding",
        ),
    ]

    @pytest.mark.parametrize(
        "board_str, expected_encoding",
        [case[:2] for case in BOARD_CASES],
        ids=[case[2] for case in BOARD_CASES],
    )
    def test_board_encoding(self, board_str, expected_encoding):
        encoded = encode_board_for_nn(board_str)
        assert len(encoded) == 18
        assert encoded == expected_encoding
