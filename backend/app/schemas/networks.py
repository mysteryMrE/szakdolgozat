from datetime import datetime
from pydantic import BaseModel


class NetworkCreateRequest(BaseModel):
    name: str
    layers: list[int] | None = None


class NetworkConfig(BaseModel):
    layers: list[int]
    weights: list[list[list[float]]]
    biases: list[list[float]]


class NetworkDoc(BaseModel):
    id: str
    userId: str
    name: str
    nn: NetworkConfig
    meta: dict | None
    createdAt: datetime | str | None = None
    updatedAt: datetime | str | None = None


class NetworkUpdateRequest(BaseModel):
    name: str | None = None
    nn: NetworkConfig | None = None
    meta: dict | None = None


class NetworkDeleteResponse(BaseModel):
    detail: str
