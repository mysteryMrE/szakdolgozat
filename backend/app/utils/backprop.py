from app.utils.minimax import minimax
from app.utils.menace import generate_ongoing_canonical_positions
from app.utils.neural_network import encode_board_for_nn

CACHE = None  # only useful if its called multiple times in the same process


def get_training_data():
    global CACHE
    if CACHE is not None:
        return CACHE
    else:
        ongoing_boards_str = generate_ongoing_canonical_positions()
        targets = []
        for board in ongoing_boards_str:
            targets.append(minimax(board))
        inputs = [encode_board_for_nn(board) for board in ongoing_boards_str]
        input_target_pairs = list(zip(inputs, targets))
        CACHE = input_target_pairs
        return input_target_pairs
