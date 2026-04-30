from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.services.authenticator import Authenticator
from slowapi.util import get_remote_address
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Preprocesses auth context for HTTP requests and stores it in request.state."""

    def __init__(self, app, auth: Authenticator):
        super().__init__(app)
        self._auth = auth

    async def dispatch(self, request: Request, call_next):
        request.state.rate_limit_uid = None
        request.state.auth_access_payload = None
        request.state.rate_limit_ip = get_remote_address(request)

        auth = self._auth
        token = auth.parse_bearer(request.headers.get("Authorization"))
        if not token:
            token = request.query_params.get("token")

        if token:
            payload = auth.decode_access(token)
            if payload and payload.get("sub"):
                request.state.auth_access_payload = payload
                request.state.rate_limit_uid = str(payload.get("sub"))
        logger.info(
            f"[AUTH MIDDLEWARE] UID: {request.state.rate_limit_uid}, IP: {request.state.rate_limit_ip}, auth payload: {request.state.auth_access_payload}"
        )
        response = await call_next(request)
        logger.debug("[Auth middleware response]")
        return response


# to_thread does give some speedup but with more requets the overhead is too big
# Single decode: avg=0.0207ms (min=0.0193, max=0.3611)
# === JWT THROUGHPUT: SEQUENTIAL VS CONCURRENT ===
#   Sequential (2000 decodes): 42.15ms total
#   Concurrent via to_thread (Sem=6, 2000 tasks): 300.21ms total
#   Speedup: 0.14x

# === JWT GIL RELEASE TEST ===
#   2x Chunks Sequential: 201.72ms
#   2x Chunks Threaded:   191.88ms
#   Speedup: 1.05x
