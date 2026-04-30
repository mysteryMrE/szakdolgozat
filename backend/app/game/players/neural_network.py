from ..player import Player
from app.neural_networks import NeuralNetwork
from app.utils import encode_board_for_nn, canonical_with_map
import numpy as np
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class NeuralNetworkPlayer(Player):
    """Represents a Neural Network player in the game."""

    def __init__(
        self,
        player_id: str,
        p_type: str,
        network: NeuralNetwork,
        name: str | None = None,
    ):
        resolved_name = (
            name
            if name is not None
            else "Genetikus" if p_type == "genetic_nn" else "Visszaterjesztés"
        )
        super().__init__(
            player_id=player_id, player_name=resolved_name, player_type=p_type
        )
        self.network = network
        self._prefer_masked = p_type == "genetic_nn"

    def _predict_canonical_move(self, board: list[str | None], masked: bool) -> int:
        """Predict move index by evaluating the board in canonical space."""
        canonical_board, mapping = canonical_with_map(board)
        nn_input = encode_board_for_nn(canonical_board)

        if masked:
            scores = self.network.predict_stats(nn_input)
            for index in range(len(scores)):
                if canonical_board[index] != "_":
                    scores[index] = -np.inf
            canon_move = int(np.argmax(scores))
        else:
            canon_move = self.network.predict(nn_input)

        return int(mapping[canon_move])

    async def _get_move_masked(self, board: list[str | None]) -> int:
        """
        Selects a move based on the current board state using masking strategy.

        Finds the canonical form of the board and
        converts it to neural network input.
        Uses masking on the network prediction to
        prevent selecting already occupied positions.

        Args:
            board: Current board state as a list.

        Returns:
            int: The selected move index (0-8).

        Raises:
            RuntimeError: If no valid move was found.
        """

        move = self._predict_canonical_move(board, masked=True)
        if board[move] is not None:
            raise RuntimeError(
                "NeuralNetworkPlayer selected an occupied position with masking"
            )
        return move

    async def get_move(self, board: list[str | None]) -> int:
        """
        Selects a move based on the current board state using the Neural Network.

        For "Genetic NN" type, it uses masking strategy, because genetic was trained that way,
        and calls get_move_masked().

        For "Backprop NN" type, it finds the canonical form of the board,
        converts it to neural network input, and uses the network to predict the move.

        Args:
            board: Current board state as a list.
        Returns:
            int: The selected move index (0-8).
        Raises:
            RuntimeError: If no valid move was found.
        """
        await super().get_move(board)
        if self._prefer_masked:
            return await self._get_move_masked(board)
        move = self._predict_canonical_move(board, masked=False)
        if board[move] is not None:
            logger.debug(
                "Prediction FAILED, falling back to masking " + self.get_name()
            )
            move = await self._get_move_masked(board)
        return move


# for a 200 node network avg=0.5170ms (min=0.4888, max=0.8926)
# IMPORTANT: for larger networks consider adding to_thread or process pool

# development test code
# async def test_nn_player():
#     from ...services import PlayerFactory
#     from ...utils import generate_ongoing_canonical_positions

#     async def test():
#         factory = PlayerFactory.get_instance()
#         player = await factory.create_player(
#             "backprop_nn", "Test NN", "18-18-12-9_1000-6"
#         )
#         boards = generate_ongoing_canonical_positions()
#         for board in boards:
#             move = player.get_move([i if i != " " else None for i in board])

#     await test()
