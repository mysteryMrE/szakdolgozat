from .board_normalizer import board_to_list
from .board_normalizer import BoardInput


def check_win(board: str, player: str) -> bool:
    """
    Checks if the given player has won on the board.
    """
    winning_combinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ]
    for combo in winning_combinations:
        if board[combo[0]] == board[combo[1]] == board[combo[2]] == player:
            return True
    return False


def is_full(board):
    return None not in board


def get_empty_cells(board):
    return [i for i, cell in enumerate(board) if cell is None]


def evaluate(board, player_marker, opponent_marker, depth):
    """
    Evaluates the board state and returns a score.
    Takes depth into account.
    """
    if check_win(board, player_marker):
        return 10 - depth
    elif check_win(board, opponent_marker):
        return depth - 10
    elif is_full(board):
        return 0
    return None


def minimax_recursive(board, depth, is_maximizing, player_marker, opponent_marker):
    """
    Minimax algorithm implementation for Tic-Tac-Toe.

    Args:
        board: list of 9 elements representing the Tic-Tac-Toe board, with 'X', 'O', or None
        depth: current depth in the game tree
        is_maximizing: boolean indicating if the current layer is maximizing or minimizing
        player_marker: marker for the maximizing player ('X' or 'O')
        opponent_marker: marker for the minimizing player ('X' or 'O')
    """
    score = evaluate(board, player_marker, opponent_marker, depth)

    if score is not None:
        return score

    if is_maximizing:
        best_score = float("-inf")
        for move in get_empty_cells(board):
            board[move] = player_marker
            score = minimax_recursive(
                board, depth + 1, False, player_marker, opponent_marker
            )
            board[move] = None
            best_score = max(best_score, score)
        return best_score
    else:
        best_score = float("inf")
        for move in get_empty_cells(board):
            board[move] = opponent_marker
            score = minimax_recursive(
                board, depth + 1, True, player_marker, opponent_marker
            )
            board[move] = None
            best_score = min(best_score, score)
        return best_score


def minimax(board_in: BoardInput) -> int:
    """
    Determines the best move on the board for the current player using the Minimax algorithm.

    Args:
        board: list of 9 elements representing the Tic-Tac-Toe board, with 'X', 'O', or None
    Returns:
        int: The index of the best move (0-8)
    """
    board = board_to_list(board_in)
    player_count = sum(1 for cell in board if cell == "X")
    opponent_count = sum(1 for cell in board if cell == "O")

    player_marker = "X" if player_count == opponent_count else "O"
    opponent_marker = "O" if player_marker == "X" else "X"

    best_score = float("-inf")
    best_move = -1

    for move in get_empty_cells(board):
        board[move] = player_marker
        score = minimax_recursive(board, 0, False, player_marker, opponent_marker)
        board[move] = None

        if score > best_score:
            best_score = score
            best_move = move

    return best_move


if __name__ == "__main__":
    board_example = ["X", "O", "X", "O", "X", None, None, "O", None]

    print(f"Current board: {board_example}")
    best_move = minimax(board_example)
    print(f"The best move is at index: {best_move}")

    board_example: list[None | str] = [None] * 9

    print(f"Current board: {board_example}")
    best_move = minimax(board_example)
    print(f"The best move is at index: {best_move}")
