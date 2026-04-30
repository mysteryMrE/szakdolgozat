from pydantic import BaseModel, ConfigDict, Field
import uuid

from app.contracts.player import PlayerLike


class PlayerItem(BaseModel):
    id: str
    type: str
    name: str


class GameConfigCreate(BaseModel):
    player1: PlayerItem
    player2: PlayerItem
    player_delay_ms: int
    round_delay_ms: int
    auto: bool
    rounds: int


class GameConfigUpdate(BaseModel):
    player_delay_ms: int | None = None
    round_delay_ms: int | None = None
    rounds: int | None = None


class GameResponse(BaseModel):
    board: list[list[str | None]]
    current_turn: str
    status: str
    rounds: int
    curr_round: int
    x_o_draw: dict[str, int]


class GameSettings(BaseModel):
    player_delay_ms: int
    round_delay_ms: int
    auto: bool
    rounds: int
    player1: PlayerItem
    player2: PlayerItem


class GameState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    board: list[list[str | None]] = Field(
        default_factory=lambda: [[None for _ in range(3)] for _ in range(3)]
    )
    player1: PlayerLike
    player2: PlayerLike

    auto: bool
    current_turn: str = "X"
    status: str = "ongoing"
    rounds: int = 1
    curr_round: int = 1
    player_delay_ms: int = 1000
    round_delay_ms: int = 1000
    x_wins: int = 0
    o_wins: int = 0
    draws: int = 0
