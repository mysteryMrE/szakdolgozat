from fastapi import FastAPI
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from app.core.logger import AppLogger

logger = AppLogger(__name__)

"""
The ProxyHeadersMiddleware checks if the incoming request is from a trusted socket peer.
If it is, it checks the 'X-Forwarded-For' and 'X-Forwarded-Proto' headers to update the client IP and scheme.
It iterates from right to left and takes the first not trutsted value it finds, and sets that as the client IP.
If all values are trusted, it takes the leftmost value.
If peer is not trusted, the headers are ignored.
"""


class ProxyMiddleWare:
    """Class to handle proxy headers middleware registration."""

    def __init__(
        self,
        trusted_hosts: list[str] | None = None,
    ):
        self._trusted_hosts = trusted_hosts if trusted_hosts is not None else ["*"]

    def register(self, app: FastAPI):
        app.add_middleware(
            ProxyHeadersMiddleware,  # type: ignore
            trusted_hosts=self._trusted_hosts,
        )
        logger.info(
            f"[Middleware] ProxyHeadersMiddleware registered with trusted hosts: {self._trusted_hosts}"
        )
