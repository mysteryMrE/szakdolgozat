from pydantic import BaseModel, Field
from typing import Annotated
from app.core.config import config as app_config
from typing import TypedDict, Literal
from dataclasses import dataclass
from multiprocessing.context import SpawnProcess
from multiprocessing.connection import Connection
import asyncio

MAX_EPOCHS = app_config.get_max_epochs()


class TrainParams(BaseModel):
    epochs: Annotated[int, Field(gt=0, le=MAX_EPOCHS)] = 1000
    learning_rate: float = 0.01
    early_stopping_threshold: float = 0.01


class TrainWorkerRequest(BaseModel):
    network: dict
    params: TrainParams


class TrainRequest(BaseModel):
    networkId: str
    method: str
    params: TrainParams


class TrainStatus(BaseModel):
    jobId: str
    status: str
    progress: float | None = None
    accuracy: float | None = None
    loss: float | None = None
    error: str | None = None


class JobState(TypedDict):
    id: str
    userId: str
    networkId: str
    method: str
    status: Literal["queued", "running", "done", "error"]
    progress: float
    createdAt: str
    startedAt: str | None
    accuracy: float | None
    loss: float | None
    error: str | None


@dataclass(slots=True)
class JobContext:
    id: str
    user_id: str
    process: SpawnProcess
    pipe: Connection
    event_queue: asyncio.Queue
    monitor_task: asyncio.Task
    data: JobState

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, JobContext):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        return hash(self.id)
