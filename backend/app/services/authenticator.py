from app.core.config import config as app_config
import jwt
import time
import bcrypt
import hmac
import hashlib
from app.core.logger import AppLogger
from .singleton import Singleton

logger = AppLogger(__name__)


class Authenticator(metaclass=Singleton):
    """
    Singleton class providing a service for handling authentication tasks such as password hashing,
    token issuance, token verification, and parsing.
    """

    def __init__(self):
        config = app_config
        self._JWT_SECRET = config.get_jwt_secret()
        self._JWT_ALG = config.get_jwt_alg()
        self._ACCESS_TTL_SECONDS = config.get_access_ttl()
        self._REFRESH_IDLE_SECONDS = config.get_refresh_idle()

    def hash_password(self, password: str) -> str:
        """
        Hashes a password using bcrypt.
        """
        hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        return hashed_pw.decode("utf-8")

    def verify_password(self, password: str, hashed: str) -> bool:
        """
        Verifies a password against a bcrypt hash.
        In case of any error during verification, returns False.
        """
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False

    def hash_refresh(self, token: str) -> str:
        """
        Hashes a refresh token using SHA-256.
        Refresh tokens can be long, so bycrypt is not suitable.
        """
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def verify_refresh(self, token: str, hashed: str) -> bool:
        """
        Verifies a refresh token against a SHA-256 hash.
        """
        token_hash = self.hash_refresh(token)
        return hmac.compare_digest(token_hash, hashed)

    def issue_access_token(
        self, user_id: str, username: str, session_id: str
    ) -> str | None:
        """
        Issues a JWT access token for the given user and session.
        Contains user ID, username, session ID, issued at time, expiration time, and token type.
        """
        payload = {
            "sub": user_id,
            "sid": session_id,
            "username": username,
            "iat": int(time.time()),
            "exp": int(time.time()) + self._ACCESS_TTL_SECONDS,
            "typ": "access",
        }
        try:
            token = jwt.encode(payload, self._JWT_SECRET, algorithm=self._JWT_ALG)
            return token
        except Exception as e:
            logger.debug(f"[AUTH] Error issuing access token: {e}")
            return None

    def issue_refresh_token(self, session_id: str) -> str | None:
        """
        Issues a JWT refresh token for the given session.
        Contains session ID, issued at time, and token type.
        """
        payload = {"sid": session_id, "iat": int(time.time()), "typ": "refresh"}
        try:
            token = jwt.encode(payload, self._JWT_SECRET, algorithm=self._JWT_ALG)
            return token
        except Exception as e:
            logger.debug(f"[AUTH] Error issuing refresh token: {e}")
            return None

    def decode_refresh(self, token: str) -> dict | None:
        """
        Decodes and verifies a JWT refresh token.
        """
        try:
            payload = jwt.decode(
                token,
                self._JWT_SECRET,
                algorithms=[self._JWT_ALG],
                options={"require": ["iat", "sid", "typ"]},
            )

            if payload.get("typ") != "refresh":
                return None
            return payload
        except Exception as e:
            logger.debug(f"[AUTH] Error decoding refresh token: {e}")
            return None

    def decode_access(self, token: str) -> dict | None:
        """
        Decodes and verifies a JWT access token.
        """
        try:
            payload = jwt.decode(
                token,
                self._JWT_SECRET,
                algorithms=[self._JWT_ALG],
                options={"require": ["exp", "iat", "sub", "typ", "sid", "username"]},
            )
            if payload.get("typ") != "access":
                return None
            return payload
        except Exception as e:
            logger.debug(f"[AUTH] Error decoding access token: {e}")
            return None

    def parse_bearer(self, authorization: str | None) -> str | None:
        """
        Parses a Bearer token from the Authorization header.
        Expects the header to be in the format "Bearer tokenX".
        """
        if not authorization:
            return None
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        return None

    def get_refresh_ttl(self) -> int:
        return self._REFRESH_IDLE_SECONDS
