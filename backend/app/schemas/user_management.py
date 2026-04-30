from pydantic import BaseModel


class User(BaseModel):
    id: str
    username: str


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenPair(BaseModel):
    accessToken: str
    refreshToken: str


class LoginResponse(BaseModel):
    user: User
    tokens: TokenPair


class RefreshRequest(BaseModel):
    refreshToken: str


class RefreshResponse(BaseModel):
    tokens: TokenPair


class LogoutRequest(BaseModel):
    refreshToken: str


class LogoutResponse(BaseModel):
    ok: bool


class NameAvailableResponse(BaseModel):
    available: bool
