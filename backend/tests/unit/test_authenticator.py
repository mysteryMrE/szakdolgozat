import time
import jwt
from app.services.authenticator import Authenticator
import pytest


class TestAuthenticator:
    def test_singleton_instance(self, authenticator: Authenticator):
        auth2 = Authenticator.get_instance()
        assert authenticator is auth2

    def test_password_hashing(self, authenticator: Authenticator):
        password = "SecurePassword123"
        hash1 = authenticator.hash_password(password)
        hash2 = authenticator.hash_password(password)

        assert hash1 is not None
        assert hash2 is not None
        assert isinstance(hash1, str)
        assert isinstance(hash2, str)
        assert hash1 != hash2

        assert authenticator.verify_password(password, hash1) is True
        assert authenticator.verify_password(password, hash2) is True

    def test_password_verification_success(self, authenticator: Authenticator):
        password = "Test123"
        hashed = authenticator.hash_password(password)
        assert authenticator.verify_password(password, hashed) is True

    def test_password_verification_failure(self, authenticator: Authenticator):
        password = "Test123"
        wrong_password = "NotTest123"
        hashed = authenticator.hash_password(password)
        assert authenticator.verify_password(wrong_password, hashed) is False

    def test_password_verification_invalid_hash(self, authenticator: Authenticator):
        assert authenticator.verify_password("password", "invalid_hash") is False

    def test_access_token_generation(self, authenticator: Authenticator):
        user_id = "id123"
        username = "testuser"
        session_id = "session123"

        token = authenticator.issue_access_token(user_id, username, session_id)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_access_token_decode(self, authenticator: Authenticator):
        user_id = "id123"
        username = "testuser"
        session_id = "session123"

        token = authenticator.issue_access_token(user_id, username, session_id)
        payload = authenticator.decode_access(token)

        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["username"] == username
        assert payload["sid"] == session_id
        assert payload["typ"] == "access"
        assert "iat" in payload
        assert "exp" in payload

    def test_access_token_expiration(self, authenticator: Authenticator):
        token = authenticator.issue_access_token("id123", "testuser", "session123")
        payload = authenticator.decode_access(token)

        now = int(time.time())
        assert payload["exp"] > now
        assert payload["iat"] <= now

    def test_refresh_token_generation(self, authenticator: Authenticator):
        session_id = "session123"
        token = authenticator.issue_refresh_token(session_id)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_refresh_token_decode(self, authenticator: Authenticator):
        session_id = "session123"
        token = authenticator.issue_refresh_token(session_id)
        payload = authenticator.decode_refresh(token)

        assert payload is not None
        assert payload["sid"] == session_id
        assert payload["typ"] == "refresh"
        assert "iat" in payload

    def test_refresh_token_hashing(self, authenticator: Authenticator):
        token = "refresh_token_123"
        hashed = authenticator.hash_refresh(token)

        assert hashed is not None
        assert isinstance(hashed, str)
        assert len(hashed) == 64

        assert authenticator.verify_refresh(token, hashed) is True
        assert authenticator.verify_refresh("wrong_token", hashed) is False

    def test_decode_access_with_invalid_token(self, authenticator: Authenticator):
        assert authenticator.decode_access("invalid_token") is None
        assert authenticator.decode_access("") is None

    def test_decode_refresh_with_invalid_token(self, authenticator: Authenticator):
        assert authenticator.decode_refresh("invalid_token") is None
        assert authenticator.decode_refresh("") is None

    def test_decode_access_with_tampered_token(self, authenticator: Authenticator):
        user_id = "id123"
        username = "testuser"
        session_id = "session123"
        token = authenticator.issue_access_token(user_id, username, session_id)
        tampered_token = token + "tampered"
        assert authenticator.decode_access(tampered_token) is None

    def test_decode_refresh_with_tampered_token(self, authenticator: Authenticator):
        session_id = "session123"
        token = authenticator.issue_refresh_token(session_id)
        tampered_token = token + "tampered"
        assert authenticator.decode_refresh(tampered_token) is None

    def test_decode_access_token_expired(self, authenticator: Authenticator):
        user_id = "id123"
        username = "testuser"
        session_id = "session123"
        token = authenticator.issue_access_token(user_id, username, session_id)
        payload = authenticator.decode_access(token)
        payload["exp"] = int(time.time()) - 10
        expired_token = jwt.encode(
            payload,
            authenticator._JWT_SECRET,
            algorithm=authenticator._JWT_ALG,
        )
        assert authenticator.decode_access(expired_token) is None

    @pytest.mark.parametrize(
        "skipField",
        [
            "sub",
            "sid",
            "username",
            "iat",
            "exp",
            "typ",
        ],
        ids=[
            "missing_sub",
            "missing_sid",
            "missing_username",
            "missing_iat",
            "missing_exp",
            "missing_typ",
        ],
    )
    def test_decode_access_missing_fields(
        self, skipField, authenticator: Authenticator
    ):
        token = authenticator.issue_access_token("uid123", "testuser", "sid123")
        payload = authenticator.decode_access(token)
        payload.pop(skipField, None)
        modified_token = jwt.encode(
            payload,
            authenticator._JWT_SECRET,
            algorithm=authenticator._JWT_ALG,
        )
        assert authenticator.decode_access(modified_token) is None

    @pytest.mark.parametrize(
        "skipField",
        [
            "sid",
            "iat",
            "typ",
        ],
        ids=[
            "missing_sid",
            "missing_iat",
            "missing_typ",
        ],
    )
    def test_decode_refresh_missing_fields(
        self, authenticator: Authenticator, skipField
    ):
        token = authenticator.issue_refresh_token("sid123")
        payload = authenticator.decode_refresh(token)
        payload.pop(skipField, None)
        modified_token = jwt.encode(
            payload,
            authenticator._JWT_SECRET,
            algorithm=authenticator._JWT_ALG,
        )
        assert authenticator.decode_refresh(modified_token) is None

    def test_decode_access_token_wrong_type(self, authenticator: Authenticator):
        token = authenticator.issue_access_token("uid123", "testuser", "sid123")
        payload = authenticator.decode_access(token)
        payload["typ"] = "refresh"
        modified_token = jwt.encode(
            payload,
            authenticator._JWT_SECRET,
            algorithm=authenticator._JWT_ALG,
        )
        assert authenticator.decode_access(modified_token) is None

    def test_decode_refresh_token_wrong_type(self, authenticator: Authenticator):
        token = authenticator.issue_refresh_token("sid123")
        payload = authenticator.decode_refresh(token)
        payload["typ"] = "access"
        modified_token = jwt.encode(
            payload,
            authenticator._JWT_SECRET,
            algorithm=authenticator._JWT_ALG,
        )
        assert authenticator.decode_refresh(modified_token) is None

    def test_parse_bearer_token_success(self, authenticator: Authenticator):
        token_in_bearer = "Mytoken123"
        authorization = f"Bearer {token_in_bearer}"
        token = authenticator.parse_bearer(authorization)

        assert token == token_in_bearer
        assert token != token_in_bearer + "extra"
        assert token != token_in_bearer.lower()

    def test_parse_bearer_token_missing_token(self, authenticator: Authenticator):
        assert authenticator.parse_bearer("Bearer") is None
        assert authenticator.parse_bearer("Bearer ") is None

    def test_parse_bearer_token_invalid_format(self, authenticator: Authenticator):
        """Test parsing invalid Authorization header returns None."""
        assert authenticator.parse_bearer("Token abc123") is None
        assert authenticator.parse_bearer("abc123") is None
        assert authenticator.parse_bearer("abc123 Bearer") is None
        assert authenticator.parse_bearer("") is None
        assert authenticator.parse_bearer(None) is None

    def test_get_refresh_ttl(self, authenticator: Authenticator):
        ttl = authenticator.get_refresh_ttl()
        assert isinstance(ttl, int)
        assert ttl > 0
