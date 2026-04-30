import numpy as np
from app.schemas.networks import NetworkConfig

from .board_normalizer import board_to_str
from .board_normalizer import BoardInput

"""
Credits:
https://medium.com/thedeephub/he-and-xavier-weight-initialization-functions-acedc5322ce5
https://stats.stackexchange.com/questions/373136/softmax-weights-initialization
"""


def init_network(layer_sizes: list[int] | None = None):
    """
    Initialize network with He initialization for ReLU layers and Xavier for output.

    Args:
        layer_sizes: List of layer sizes (e.g., [18, 32, 16, 9])

    Returns:
        NetworkConfig: Network configuration with layers, weights, and biases
    """
    if layer_sizes is None:
        layer_sizes = [18, 12, 9]

    weights_matrix = []
    biases_matrix = []

    for i in range(len(layer_sizes) - 1):
        input_size = layer_sizes[i]
        output_size = layer_sizes[i + 1]

        if i < len(layer_sizes) - 2:  # Hidden layers
            # He initialization for ReLU
            standard_deviation = np.sqrt(2.0 / input_size)
            weights = np.random.randn(output_size, input_size) * standard_deviation
        else:  # Output layer
            # Xavier/Glorot initialization for Softmax
            limit = np.sqrt(6.0 / (input_size + output_size))
            weights = np.random.uniform(-limit, limit, (output_size, input_size))
        biases = np.zeros(output_size)

        weights_matrix.append(weights.tolist())
        biases_matrix.append(biases.tolist())

    return NetworkConfig(
        layers=layer_sizes, weights=weights_matrix, biases=biases_matrix
    )


def encode_board_for_nn(board: BoardInput) -> list[int]:
    """
    Encodes a board into a list for NN.

    Args:
        board: board as str, flat list/tuple, or 3x3 list/tuple

    Returns:
        list[int]: A list of 18 integers 'X' => [1, 0] 'O' => [0, 1] '\\_' => [0, 0]
    """
    board_str = board_to_str(board)

    encoding = []
    for cell in board_str:
        if cell == "X":
            encoding.extend([1, 0])
        elif cell == "O":
            encoding.extend([0, 1])
        else:
            encoding.extend([0, 0])
    return encoding
