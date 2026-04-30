from enum import Enum


class PlayerType(str, Enum):
    RANDOM = "random"
    MENACE = "menace"
    HUMAN = "human"
    MINIMAX = "minimax"
    BACKPROP_NN = "backprop_nn"
    GENETIC_NN = "genetic_nn"
