import random
from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True, slots=True)
class TrainingLevel:
    level_id: int
    name: str
    threshold: float
    minimax_prob: float

    @property
    def opponent(self) -> Literal["random", "minimax"]:
        return "minimax" if random.random() < self.minimax_prob else "random"
