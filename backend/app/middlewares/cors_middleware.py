from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class CorsMiddleWare:
    """Class to handle CORS middleware registration."""

    def __init__(
        self,
        allow_origins: list[str] | None = None,
        allow_credentials: bool = False,
        allow_methods: list[str] | None = None,
        allow_headers: list[str] | None = None,
    ):
        self._allow_origins = allow_origins if allow_origins is not None else ["*"]
        self._allow_methods = allow_methods if allow_methods is not None else ["*"]
        self._allow_headers = allow_headers if allow_headers is not None else ["*"]
        self._allow_credentials = allow_credentials

    def register(self, app: FastAPI):
        app.add_middleware(
            CORSMiddleware,
            allow_origins=self._allow_origins,
            allow_credentials=self._allow_credentials,
            allow_methods=self._allow_methods,
            allow_headers=self._allow_headers,
        )
        logger.info("CORS middleware registered with the app.")
        logger.info(f"Allowed Origins: {self._allow_origins}")
        logger.info(f"Allow Credentials: {self._allow_credentials}")
        logger.info(f"Allowed Methods: {self._allow_methods}")
        logger.info(f"Allowed Headers: {self._allow_headers}")
