from typing import Literal

import numpy as np
import random, json, math
from app.schemas.trainers import TrainingLevel
from app.neural_networks.neural_network import NeuralNetwork

from app.schemas import NetworkConfig
from app.utils.genome import Genome

from app.utils import (
    encode_board_for_nn,
    generate_ongoing_canonical_positions,
    minimax,
    is_terminal,
    winner_of,
    canonical_with_map,
    init_network,
)
from app.core.logger import AppLogger
from app.core.config import config as app_config

logger = AppLogger(__name__)

Training = [
    TrainingLevel(0, "EASY", threshold=0.0, minimax_prob=0.1),
    TrainingLevel(1, "MEDIUM", threshold=0.3, minimax_prob=0.5),
    TrainingLevel(2, "HARD", threshold=0.6, minimax_prob=0.8),
]


POP_TOTAL = app_config.get_genetic_pop_total()
ISLANDS = app_config.get_genetic_islands()
GENERATIONS = app_config.get_genetic_generations()
ELITE_PER_ISLAND = max(2, POP_TOTAL // ISLANDS // 6)
TOURNAMENT_SIZE = app_config.get_genetic_tournament_size()
DEFAULT_TOURNAMENT_SIZE = TOURNAMENT_SIZE
INITIAL_MUTATION_PROB = app_config.get_genetic_initial_mutation_prob()
FINAL_MUTATION_PROB = app_config.get_genetic_final_mutation_prob()
INITIAL_MUTATION_SIGMA = app_config.get_genetic_initial_mutation_sigma()
FINAL_MUTATION_SIGMA = app_config.get_genetic_final_mutation_sigma()
MIGRATION_INTERVAL = app_config.get_genetic_migration_interval()
MIGRANTS_PER_ISLAND = app_config.get_genetic_migrants_per_island()
STAGNATION_THRESHOLD = app_config.get_genetic_stagnation_threshold()
EXTINCTION_THRESHOLD = app_config.get_genetic_extinction_threshold()
LAYER_SIZES = app_config.get_genetic_layer_sizes()
WIN_REWARD = app_config.get_genetic_win_reward()
LOSS_PENALTY = app_config.get_genetic_loss_penalty()
DRAW_REWARD = app_config.get_genetic_draw_reward()


def generate_test_data():
    """
    Generate test data using minimax for all ongoing canonical positions.
    Used in training to provide target moves for the neural network.

    Returns:
        tuple (boards_for_nn, moves): List of encoded boards for NN and corresponding minimax moves
    """
    boards_str = generate_ongoing_canonical_positions()
    moves = [minimax(b) for b in boards_str]
    boards_for_nn = [encode_board_for_nn(b) for b in boards_str]
    return (boards_for_nn, moves)


def generate_minimax():
    """
    Generate board - minimax move for all ongoing canonical positions.
    Used as a cache for quick minimax lookups during training.

    Returns:
        tuple (boards_str, moves): List of board strings and corresponding minimax moves
    """
    boards_str = generate_ongoing_canonical_positions()
    moves = [minimax(b) for b in boards_str]
    return (boards_str, moves)


# Lazy initialization, only compute when needed, not at import time
_test_boards = None
_test_moves = None
_minimax_move_dict = None


def get_test_data():
    """Get test data, computing it lazily on first access."""
    global _test_boards, _test_moves
    if _test_boards is None:
        _test_boards, _test_moves = generate_test_data()
    return _test_boards, _test_moves


def get_minimax_dict():
    """Get minimax move dictionary, computing it lazily on first access."""
    global _minimax_move_dict
    if _minimax_move_dict is None:
        _minimax_move_dict = dict(zip(*generate_minimax()))
    return _minimax_move_dict


def play_game(
    nn: NeuralNetwork,
    as_player: str,
    opponent_strategy: Literal["random", "minimax"] = "random",
    win_reward: float = WIN_REWARD,
    loss_penalty: float = LOSS_PENALTY,
    draw_reward: float = DRAW_REWARD,
    debug: bool = False,
) -> float:
    """
    Play a game of Tic-Tac-Toe between the neural network and an opponent.

    Args:
        nn (NeuralNetwork): The neural network playing the game
        as_player (str): The mark of the player (either "X" or "O")
        opponent_strategy (str): The strategy of the opponent ("random" or "minimax")
        win_reward (float): Reward for winning the game
        loss_penalty (float): Penalty for losing the game
        draw_reward (float): Reward for drawing the game
        debug (bool): If True, print debug information

    Returns:
        int: The reward based on the game outcome
    """
    board = "_" * 9
    current = "X"
    opponent_mark = "O" if as_player == "X" else "X"

    while True:
        # Board is in canonical form thorughout
        canonical_board, _ = canonical_with_map(board)

        winner = winner_of(canonical_board)
        if winner is not None:
            if debug:
                logger.debug(f"    Game over! Winner: {winner}")
            return win_reward if winner == as_player else loss_penalty
        if is_terminal(canonical_board):
            if debug:
                logger.debug(f"    Game over! Draw")
            return draw_reward

        if current == as_player:
            nn_board = encode_board_for_nn(canonical_board)
            probs = nn.predict_stats(nn_board)
            # masking
            while True:
                move = int(np.argmax(probs))
                if canonical_board[move] == "_":
                    break
                probs[move] = -np.inf
            if debug:
                logger.debug(f"      NN ({as_player}) plays at position {move}")
        else:
            if opponent_strategy == "minimax":
                minimax_dict = get_minimax_dict()
                if canonical_board not in minimax_dict:
                    if debug:
                        logger.debug(
                            f"      ERROR: Board not in minimax_move_dict: {canonical_board}"
                        )
                    raise KeyError(f"Board not in minimax dict: {canonical_board}")
                move = minimax_dict[canonical_board]
                if debug:
                    logger.debug(
                        f"      Minimax ({opponent_mark}) plays at position {move}"
                    )
            else:
                moves = [i for i, v in enumerate(canonical_board) if v == "_"]
                move = random.choice(moves)

        board = canonical_board[:move] + current + canonical_board[move + 1 :]

        current = "O" if current == "X" else "X"


def fitness(
    nn: NeuralNetwork, current_level: TrainingLevel, games_per_side=20
) -> float:
    """
    Evaluate the fitness of a neural network by playing games against an opponent
    determined by the current curriculum level.

    Args:
        nn (NeuralNetwork): The neural network to evaluate
        current_level (TrainingLevel): The current training level
        games_per_side (int): Number of game sets to play

    Returns:
        float: The calculated fitness score between 0 and 1
    """

    score = 0

    for _ in range(games_per_side):
        opponent = current_level.opponent

        # 1 game as X
        result = play_game(nn, "X", opponent)
        score += result

        # 2 games as O (harder side)
        result = play_game(nn, "O", opponent)
        score += result

        result = play_game(nn, "O", opponent)
        score += result

    total_games = 3 * games_per_side

    # Lose every time = LOSS_PENALTY * total_games
    # Win every time = WIN_REWARD * total_games
    # loss every time needs a shift to make it non-negative
    # win every time plus the shift is the denominator
    fitness_score = (score + total_games * abs(LOSS_PENALTY)) / (
        total_games * (WIN_REWARD + abs(LOSS_PENALTY))
    )

    return fitness_score


class GeneticTrainer:
    """Genetic Algorithm based trainer for Neural Networks."""

    @staticmethod
    def _init_nn_config(layer_sizes) -> NetworkConfig:
        return init_network(layer_sizes)

    @staticmethod
    def _tournament_selection(fitnesses: list[float], tournament_size: int) -> int:
        selected = random.sample(range(len(fitnesses)), tournament_size)
        best = max(selected, key=lambda x: fitnesses[x])
        return best

    def __init__(
        self,
        pop_total=POP_TOTAL,
        island_count=ISLANDS,
        layer_sizes=LAYER_SIZES,
        ELITE_PER_ISLAND: int | None = None,
        TOURNAMENT_SIZE: int | None = None,
        INITIAL_MUTATION_PROB=INITIAL_MUTATION_PROB,
        FINAL_MUTATION_PROB=FINAL_MUTATION_PROB,
        INITIAL_MUTATION_SIGMA=INITIAL_MUTATION_SIGMA,
        FINAL_MUTATION_SIGMA=FINAL_MUTATION_SIGMA,
        MIGRATION_INTERVAL=MIGRATION_INTERVAL,
        MIGRANTS_PER_ISLAND=MIGRANTS_PER_ISLAND,
        STAGNATION_THRESHOLD=STAGNATION_THRESHOLD,
        EXTINCTION_THRESHOLD=EXTINCTION_THRESHOLD,
        fitness_function=fitness,
        max_generations=GENERATIONS,
    ):
        self.pop_per_island = pop_total // island_count
        effective_elite_per_island = (
            ELITE_PER_ISLAND
            if ELITE_PER_ISLAND is not None
            else max(2, self.pop_per_island // 6)
        )
        effective_tournament_size = (
            TOURNAMENT_SIZE
            if TOURNAMENT_SIZE is not None
            else min(DEFAULT_TOURNAMENT_SIZE, self.pop_per_island)
        )

        # Validation
        if self.pop_per_island < 4:
            raise ValueError(
                f"pop_per_island ({self.pop_per_island}) must be at least 4. Increase POP_TOTAL or decrease ISLANDS."
            )
        if effective_elite_per_island >= self.pop_per_island:
            raise ValueError(
                f"ELITE_PER_ISLAND ({effective_elite_per_island}) must be less than pop_per_island ({self.pop_per_island})"
            )
        if effective_tournament_size > self.pop_per_island:
            raise ValueError(
                f"TOURNAMENT_SIZE ({effective_tournament_size}) must be <= pop_per_island ({self.pop_per_island})"
            )
        if effective_tournament_size < 2:
            raise ValueError(
                f"TOURNAMENT_SIZE ({effective_tournament_size}) must be at least 2 for meaningful selection"
            )
        if MIGRANTS_PER_ISLAND >= self.pop_per_island:
            raise ValueError(
                f"MIGRANTS_PER_ISLAND ({MIGRANTS_PER_ISLAND}) must be less than pop_per_island ({self.pop_per_island})"
            )

        self.islands = [
            [
                NeuralNetwork(GeneticTrainer._init_nn_config(layer_sizes).model_dump())
                for _ in range(self.pop_per_island)
            ]
            for _ in range(island_count)
        ]
        self.fitnesses = [
            [0.0 for _ in range(self.pop_per_island)] for _ in range(island_count)
        ]

        self.crossover_points = [0]
        cumulative = 0
        for i in range(len(layer_sizes) - 1):
            layer_size = layer_sizes[i] * layer_sizes[i + 1] + layer_sizes[i + 1]
            cumulative += layer_size
            self.crossover_points.append(cumulative)

        self.layer_sizes = layer_sizes
        self.ELITE_PER_ISLAND = effective_elite_per_island
        self.TOURNAMENT_SIZE = effective_tournament_size
        self.INITIAL_MUTATION_PROB = INITIAL_MUTATION_PROB
        self.FINAL_MUTATION_PROB = FINAL_MUTATION_PROB
        self.INITIAL_MUTATION_SIGMA = INITIAL_MUTATION_SIGMA
        self.FINAL_MUTATION_SIGMA = FINAL_MUTATION_SIGMA
        self.MIGRATION_INTERVAL = MIGRATION_INTERVAL
        self.MIGRANTS_PER_ISLAND = MIGRANTS_PER_ISLAND
        self.STAGNATION_THRESHOLD = STAGNATION_THRESHOLD
        self.EXTINCTION_THRESHOLD = EXTINCTION_THRESHOLD
        self.fitness_function = fitness_function
        self.max_generations = max_generations
        self.current_generation = 0

        self.current_level = Training[0]
        self.best_nn = None
        self._reset_stagnation_metrics()

    def _reset_stagnation_metrics(self):
        self.best_fitness = -math.inf
        self.island_best_fitness = [-math.inf] * len(self.islands)
        self.stagnation_counter = [0] * len(self.islands)

    def _get_mutation_params(self, generation: float, generations: float):
        progression_ratio = generation / generations
        mutation_prob = (
            self.INITIAL_MUTATION_PROB
            + (self.FINAL_MUTATION_PROB - self.INITIAL_MUTATION_PROB)
            * progression_ratio
        )
        mutation_sigma = (
            self.INITIAL_MUTATION_SIGMA
            + (self.FINAL_MUTATION_SIGMA - self.INITIAL_MUTATION_SIGMA)
            * progression_ratio
        )
        return mutation_prob, mutation_sigma

    def _migrate(self):
        for i in range(1, len(self.islands)):
            source_island = self.islands[i - 1]
            target_island = self.islands[i]
            source_fitnesses = self.fitnesses[i - 1]
            target_fitnesses = self.fitnesses[i]

            migrants_indices = np.argsort(source_fitnesses)[-self.MIGRANTS_PER_ISLAND :]
            migrants = [Genome.copy(source_island[id]) for id in migrants_indices]

            replace_indices = np.argsort(target_fitnesses)[: self.MIGRANTS_PER_ISLAND]
            for migrant, weak in enumerate(replace_indices):
                target_island[weak] = migrants[migrant]
                target_fitnesses[weak] = self._evaluate_individual(migrants[migrant])

    def _stagnation_and_extinction(self):
        # check stagnation and possible extinction
        for i in range(len(self.islands)):
            current_best = max(self.fitnesses[i])

            # Check if THIS island improved locally
            if current_best > self.island_best_fitness[i] + self.STAGNATION_THRESHOLD:
                # Island improved enough
                self.island_best_fitness[i] = current_best
                self.stagnation_counter[i] = 0
            else:
                # No improvement for this island
                self.stagnation_counter[i] += 1

            if self.stagnation_counter[i] >= self.EXTINCTION_THRESHOLD:
                logger.debug(f"Island {i} has gone extinct due to stagnation.")
                # Reinitialize with random NNs
                self.islands[i] = [
                    NeuralNetwork(
                        GeneticTrainer._init_nn_config(self.layer_sizes).model_dump()
                    )
                    for _ in range(self.pop_per_island)
                ]
                # Collect elite neighbors
                elite_neighbors = []
                for j in range(len(self.islands)):
                    if j != i:
                        elite_neighbors.extend(self._let_them_eat_cake(j))
                # Replace half with elites, if there are enough
                num_to_replace = min(len(elite_neighbors), self.pop_per_island // 2)
                for id in range(num_to_replace):
                    self.islands[i][id] = elite_neighbors[id]

                self.fitnesses[i] = [0.0 for _ in range(self.pop_per_island)]
                self.island_best_fitness[i] = -math.inf
                self.stagnation_counter[i] = 0
                logger.debug(
                    f"Island {i} has been reinitialized with {num_to_replace} elite neighbors."
                )

    def _evaluate_individual(self, nn: NeuralNetwork) -> float:
        return self.fitness_function(nn, self.current_level)

    def _evaluate_island(self, island_idx: int):
        for i, nn in enumerate(self.islands[island_idx]):
            fit = self._evaluate_individual(nn)
            self.fitnesses[island_idx][i] = fit

            if fit > self.best_fitness:
                self.best_fitness = fit
                self.best_nn = Genome.copy(nn)

            if fit > self.island_best_fitness[island_idx]:
                self.island_best_fitness[island_idx] = fit
                self.stagnation_counter[island_idx] = 0

    def _evaluate_population(self):
        for i in range(len(self.islands)):
            self._evaluate_island(i)

    def _let_them_eat_cake(self, islandID) -> list[NeuralNetwork]:
        eliteIndexes = np.argsort(self.fitnesses[islandID])[-self.ELITE_PER_ISLAND :]
        return [Genome.copy(self.islands[islandID][i]) for i in eliteIndexes]

    def _generate_new_population(self, mutation_prob: float, mutation_sigma: float):
        for islandID in range(len(self.islands)):
            if self.island_best_fitness[islandID] == -math.inf:
                continue
            number_needed = self.pop_per_island - self.ELITE_PER_ISLAND
            new_population = []
            while number_needed > 0:
                parent1ID = GeneticTrainer._tournament_selection(
                    self.fitnesses[islandID], self.TOURNAMENT_SIZE
                )
                parent2ID = GeneticTrainer._tournament_selection(
                    self.fitnesses[islandID], self.TOURNAMENT_SIZE
                )
                child1, child2 = Genome.crossover(
                    self.islands[islandID][parent1ID],
                    self.islands[islandID][parent2ID],
                    self.layer_sizes,
                    self.crossover_points,
                )
                child1 = Genome.mutate(
                    child1, self.layer_sizes, mutation_prob, mutation_sigma
                )
                child2 = Genome.mutate(
                    child2, self.layer_sizes, mutation_prob, mutation_sigma
                )
                new_population.append(child1)
                new_population.append(child2)
                number_needed -= 2
            # Trim excess
            new_population = new_population[
                : self.pop_per_island - self.ELITE_PER_ISLAND
            ]
            new_population.extend(self._let_them_eat_cake(islandID))  # add elites
            self.islands[islandID] = new_population
            self.fitnesses[islandID] = [0.0] * self.pop_per_island

    def let_the_games_begin(self) -> tuple[NeuralNetwork, dict]:
        """
        Runs the genetic algorithm training process.
        """
        if self.best_nn is None:
            self.best_nn = Genome.copy(self.islands[0][0])

        for generation in range(self.max_generations):
            self.current_generation = generation
            progress = generation / self.max_generations

            unlocked = [
                level for level in reversed(Training) if progress >= level.threshold
            ]
            new_level = unlocked[0] if unlocked else Training[0]

            if new_level != self.current_level:
                logger.debug(f"Difficulty level increased: {new_level.name}")
                self.current_level = new_level
                self._reset_stagnation_metrics()

            logger.debug(
                f"Gen {generation + 1}/{self.max_generations} | Best: {self.best_fitness:.4f} | {self.current_level.name}"
            )
            self._evaluate_population()

            if (generation + 1) % self.MIGRATION_INTERVAL == 0:
                island_bests = [
                    max(self.fitnesses[i]) for i in range(len(self.islands))
                ]
                island_avgs = [
                    sum(self.fitnesses[i]) / len(self.fitnesses[i])
                    for i in range(len(self.islands))
                ]
                logger.debug(f"  Island Best: {[f'{x:.3f}' for x in island_bests]}")
                logger.debug(f"  Island Avg:  {[f'{x:.3f}' for x in island_avgs]}")

                self._migrate()

            self._stagnation_and_extinction()

            # create next generation
            mut_prob, mut_sigma = self._get_mutation_params(
                generation, self.max_generations
            )
            # crossover and mutation to create new population
            self._generate_new_population(mut_prob, mut_sigma)

        logger.debug("Training complete.")
        return self.best_nn, {
            "fitness": self.best_fitness,
            "generations": self.max_generations,
            "population": POP_TOTAL,
            "islands": ISLANDS,
            "layer_sizes": LAYER_SIZES,
        }


"""
AI assisted testing code.
"""


def evaluate_model(
    nn: NeuralNetwork,
    as_player: str,
    opponent: Literal["random", "minimax"],
    num_games=100,
) -> tuple[int, int, int]:
    win, draw, lose = 0, 0, 0
    for _ in range(num_games):
        result = play_game(nn, as_player, opponent)
        if result == WIN_REWARD:
            win += 1
        elif result == DRAW_REWARD:
            draw += 1
        else:
            lose += 1
    return win, draw, lose


if __name__ == "__main__":
    AppLogger.setup(console_level="DEBUG")

    logger.debug("=" * 60)
    logger.debug("GENETIC ALGORITHM TRAINING FOR TIC-TAC-TOE")
    logger.debug(
        f"Population: {POP_TOTAL}, Islands: {ISLANDS}, Generations: {GENERATIONS}"
    )
    logger.debug(f"Network: {LAYER_SIZES}")
    logger.debug("=" * 60)

    gt = GeneticTrainer(max_generations=GENERATIONS)
    best_nn, meta = gt.let_the_games_begin()

    logger.debug("\n" + "=" * 60)
    logger.debug(f"TRAINING COMPLETE - Best fitness: {meta['fitness']:.4f}")
    logger.debug("=" * 60)
    logger.debug("\nFINAL EVALUATION:")
    logger.debug("-" * 60)

    logger.debug("\nVs RANDOM opponent (100 games each):")
    r_win_x, r_draw_x, r_lose_x = evaluate_model(best_nn, "X", "random")
    logger.debug(f"  As X: {r_win_x}W {r_draw_x}D {r_lose_x}L ({r_win_x}% win rate)")

    r_win_o, r_draw_o, r_lose_o = evaluate_model(best_nn, "O", "random")
    logger.debug(f"  As O: {r_win_o}W {r_draw_o}D {r_lose_o}L ({r_win_o}% win rate)")

    logger.debug("\nVs MINIMAX opponent (100 games each):")
    win_x, draw_x, lose_x = evaluate_model(best_nn, "X", "minimax")
    logger.debug(f"  As X: {win_x}W {draw_x}D {lose_x}L ({win_x}% win, {draw_x}% draw)")

    win_o, draw_o, lose_o = evaluate_model(best_nn, "O", "minimax")
    logger.debug(f"  As O: {win_o}W {draw_o}D {lose_o}L ({win_o}% win, {draw_o}% draw)")

    file_name = "genetic_cache.json"
    with open(file_name, "w") as f:
        json.dump(
            {
                "layers": best_nn.layers,
                "weights": [w for w in best_nn.weights],
                "biases": [b for b in best_nn.biases],
                "training_fitness": meta["fitness"],
                "vs_minimax": {
                    "x_wins": win_x,
                    "x_draws": draw_x,
                    "x_losses": lose_x,
                    "o_wins": win_o,
                    "o_draws": draw_o,
                    "o_losses": lose_o,
                },
                "stats": {
                    "population": POP_TOTAL,
                    "islands": ISLANDS,
                    "generations": GENERATIONS,
                },
            },
            f,
        )
    logger.debug(f"\nModel saved to: {file_name}")
    logger.debug("=" * 60)
