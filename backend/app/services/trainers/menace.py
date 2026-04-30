from typing import Any
from app.services.player_factory import player_factory
from app.game.player import Player
from app.utils import (
    canonical_with_map,
    winner_of,
    is_terminal,
    choose_weighted_move,
)
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class MenaceTrainer:
    """Trainer for the MENACE algorithm."""

    @staticmethod
    async def _play_game(
        matchboxes: dict,
        player1: str,
        player2: str,
        opponent: Player | None = None,
    ) -> tuple[dict, str]:
        """Menace plays a game against a Random opponent or another Menace player."""
        board: list[None | str] = [None] * 9
        current_player = player1
        visited_boards: dict[str, list[tuple[str, int]]] = {}
        status = ""

        while True:
            if "menace" in current_player:
                cannonical_board, mapping = canonical_with_map(board)
                canon_move = choose_weighted_move(matchboxes.get(cannonical_board, {}))
                move = mapping[canon_move] if canon_move is not None else None

                if move is not None and canon_move is not None:
                    visited_boards.setdefault(current_player, []).append(
                        (cannonical_board, canon_move)
                    )

            elif opponent is not None:
                # board should never get full in training, we throw the error
                move = await opponent.get_move(board)
            else:
                logger.debug("Error: No opponent provided for non-menace player.")
                break

            if move == -1 or move is None or board[move] is not None:
                logger.debug(f"Invalid move during training: {move}, {board}")
                break  # Invalid move or no moves left

            board[move] = "X" if current_player == player1 else "O"

            if is_terminal(board):
                winner = winner_of(board)
                if winner == "X":
                    status = player1
                elif winner == "O":
                    status = player2
                else:
                    status = "draw"
                break  # Game over

            current_player = player2 if current_player == player1 else player1

        return visited_boards, status

    @staticmethod
    def _update_matchboxes(
        matchboxes: dict,
        visited_boards: dict,
        status: str,
        reward_loss: int = -1,
        reward_win: int = 3,
        reward_draw: int = 1,
    ) -> None:
        """Updates matchboxes based on the game result for all visited boards."""
        for player, boards in visited_boards.items():
            for board, move in boards:
                if board not in matchboxes:
                    logger.debug(f"Warning: board not in matchboxes: {board}")
                    break
                if move not in matchboxes[board]:
                    logger.debug(f"Warning: move not in matchbox: {move}, {board}")
                    break

                if status == player:
                    matchboxes[board][move] += reward_win
                elif status == "draw":
                    matchboxes[board][move] += reward_draw
                else:
                    matchboxes[board][move] += reward_loss

                matchboxes[board][move] = max(1, matchboxes[board][move])

    @staticmethod
    async def _run_evaluation_games(
        matchboxes: dict,
        player1: str,
        player2: str,
        num_games: int,
        opponent: Player | None = None,
    ) -> tuple[int, int, int]:
        wins, losses, draws = 0, 0, 0

        for _ in range(num_games):
            _, status = await MenaceTrainer._play_game(
                matchboxes, player1, player2, opponent
            )
            if status == "draw":
                draws += 1
            elif "menace" in player1 and "menace" in player2:
                # In self-play - player1 = W, player2 = L
                if status == player1:
                    wins += 1
                else:
                    losses += 1
            else:
                if "menace" in status:
                    wins += 1
                else:
                    losses += 1
        return wins, losses, draws

    @staticmethod
    async def _evaluate_post_training(
        matchboxes: dict, opponent: Player | None
    ) -> dict[str, Any]:
        meta = {}

        wins, losses, draws = await MenaceTrainer._run_evaluation_games(
            matchboxes, "random", "menace", 1000, opponent
        )
        logger.debug(
            f"After training, as second player: Wins: {wins}, Losses: {losses}, Draws: {draws}"
        )
        meta["Against_random_as_second"] = {
            "wins": wins,
            "losses": losses,
            "draws": draws,
        }

        wins, losses, draws = await MenaceTrainer._run_evaluation_games(
            matchboxes, "menace", "random", 1000, opponent
        )
        logger.debug(
            f"After training, as first player: Wins: {wins}, Losses: {losses}, Draws: {draws}"
        )
        meta["Against_random_as_first"] = {
            "wins": wins,
            "losses": losses,
            "draws": draws,
        }

        wins, losses, draws = await MenaceTrainer._run_evaluation_games(
            matchboxes, "menace1", "menace2", 1000
        )
        logger.debug(
            f"After training self play: menace 1 wins: {wins}, Menace 2 wins: {losses}, Draws: {draws}"
        )
        meta["Against_itself"] = {"X_wins": wins, "O_wins": losses, "draws": draws}

        return meta

    @staticmethod
    async def train_on_random(
        training_rounds: int,
        matchboxes: dict,
        reward_loss: int = -1,
        reward_win: int = 3,
        reward_draw: int = 1,
    ) -> tuple[dict, dict]:
        opponent = await player_factory.create_player(player_type="random")

        meta: dict[str, Any] = {"training_round_on_random": training_rounds}

        for i in range(training_rounds):
            logger.debug(
                f"As first player against random training round {i+1}/{training_rounds}"
            )
            visited, status = await MenaceTrainer._play_game(
                matchboxes, "menace", "random", opponent
            )
            MenaceTrainer._update_matchboxes(
                matchboxes, visited, status, reward_loss, reward_win, reward_draw
            )

            logger.debug(
                f"As second player against random training round {i+1}/{training_rounds}"
            )
            visited, status = await MenaceTrainer._play_game(
                matchboxes, "random", "menace", opponent
            )
            MenaceTrainer._update_matchboxes(
                matchboxes, visited, status, reward_loss, reward_win, reward_draw
            )

        # Merge the evaluation data
        meta.update(await MenaceTrainer._evaluate_post_training(matchboxes, opponent))
        return matchboxes, meta

    @staticmethod
    async def train_on_menace(
        training_rounds: int,
        matchboxes: dict,
        reward_loss: int = -1,
        reward_win: int = 3,
        reward_draw: int = 1,
    ) -> tuple[dict, dict]:
        """Train Menace against Menace opponent."""
        meta: dict[str, Any] = {"training_round_on_menace": training_rounds}

        for i in range(training_rounds):
            logger.debug(f"As self training round {i+1}/{training_rounds}")
            visited, status = await MenaceTrainer._play_game(
                matchboxes, "menace1", "menace2"
            )
            MenaceTrainer._update_matchboxes(
                matchboxes, visited, status, reward_loss, reward_win, reward_draw
            )

        opponent = await player_factory.create_player(player_type="random")

        meta.update(await MenaceTrainer._evaluate_post_training(matchboxes, opponent))
        return matchboxes, meta
