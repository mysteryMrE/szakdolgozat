from pydantic import BaseModel


class InfoResponse(BaseModel):
    app: str
    version: str
    uptime_seconds: float


class HealthResponse(BaseModel):
    status: str


class DBHealthResponse(BaseModel):
    status: str


class RootResponse(BaseModel):
    message: str
