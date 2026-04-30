from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi import FastAPI
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class TrustedHostMiddleWare:
    """Class to handle Trusted Host middleware registration."""

    def __init__(
        self,
        allowed_hosts: list[str] | None = None,
    ):
        self._allowed_hosts = allowed_hosts if allowed_hosts is not None else ["*"]

    def register(self, app: FastAPI):
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=self._allowed_hosts,
        )
        logger.info("Trusted Host middleware registered with the app.")
        logger.info(f"Allowed Hosts: {self._allowed_hosts}")
