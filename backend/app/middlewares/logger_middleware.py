from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class LoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        host = request.client.host if request.client else "unknown"
        port = request.client.port if request.client else 0
        method = request.method
        path = request.url.path
        status = response.status_code

        log_msg = f'{host}:{port} - "{method} {path}" {status}'

        logger.endpoint(log_msg)

        return response
