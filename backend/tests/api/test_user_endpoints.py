from fastapi.testclient import TestClient
import asyncio
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta
import uuid


class TestUserRegistration:

    def test_register_valid_user(self, client: TestClient):

        unique_username = f"newuser{uuid.uuid4().hex[:8]}"

        response = client.post(
            "/users/register",
            json={"username": unique_username, "password": "SecurePassword123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["username"] == unique_username

    def test_register_invalid_username_too_short(self, client: TestClient):
        response = client.post(
            "/users/register", json={"username": "ab", "password": "SecurePass123"}
        )

        assert response.status_code == 422
        assert "Invalid username" in response.json()["detail"]

    def test_register_invalid_username_special_chars(self, client: TestClient):
        response = client.post(
            "/users/register",
            json={"username": "user@name!", "password": "SecurePass123"},
        )

        assert response.status_code == 422
        assert "Invalid username" in response.json()["detail"]

    def test_register_password_too_short(self, client: TestClient):
        response = client.post(
            "/users/register", json={"username": "validuser", "password": "Short1"}
        )

        assert response.status_code == 422
        assert (
            "Password must be at least 8 characters long" in response.json()["detail"]
        )

    def test_register_password_no_number(self, client: TestClient):
        response = client.post(
            "/users/register",
            json={"username": "validuser", "password": "NoNumberPass"},
        )

        assert response.status_code == 422
        assert "Password must contain at least one number" in response.json()["detail"]

    def test_register_password_no_uppercase(self, client: TestClient):
        """Test registration with password missing uppercase."""
        response = client.post(
            "/users/register",
            json={"username": "validuser", "password": "nouppercase123"},
        )

        assert response.status_code == 422
        assert (
            "Password must contain at least one uppercase letter"
            in response.json()["detail"]
        )

    def test_register_password_no_lowercase(self, client: TestClient):
        """Test registration with password missing lowercase."""
        response = client.post(
            "/users/register",
            json={"username": "validuser", "password": "NOLOWERCASE123"},
        )

        assert response.status_code == 422
        assert (
            "Password must contain at least one lowercase letter"
            in response.json()["detail"]
        )

    def test_register_duplicate_username(self, client: TestClient):

        unique_name = f"duplicate{uuid.uuid4().hex[:8]}"

        client.post(
            "/users/register",
            json={"username": unique_name, "password": "ValidPass123"},
        )

        response = client.post(
            "/users/register",
            json={"username": unique_name, "password": "DifferentPass123"},
        )

        assert response.status_code == 409
        assert "Username taken" in response.json()["detail"]

    def test_username_available_check(self, client: TestClient):
        response = client.get("/users/username_available/availableuser")
        assert response.status_code == 200
        assert response.json()["available"] is True

        client.post(
            "/users/register",
            json={"username": "takenuser", "password": "ValidPass123"},
        )

        response = client.get("/users/username_available/takenuser")
        assert response.status_code == 200
        assert response.json()["available"] is False


class TestUserLogin:

    def test_login_success(self, client: TestClient):
        client.post(
            "/users/register",
            json={"username": "loginuser", "password": "LoginPassword123"},
        )

        response = client.post(
            "/users/login",
            json={"username": "loginuser", "password": "LoginPassword123"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "tokens" in data
        assert "accessToken" in data["tokens"]
        assert "refreshToken" in data["tokens"]
        assert data["user"]["username"] == "loginuser"

    def test_login_wrong_password(self, client: TestClient):
        client.post(
            "/users/register",
            json={"username": "testuser", "password": "CorrectPassword123"},
        )

        response = client.post(
            "/users/login",
            json={"username": "testuser", "password": "WrongPassword123"},
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_nonexistent_user(self, client: TestClient):
        response = client.post(
            "/users/login",
            json={"username": "nonexistent", "password": "SomePassword123"},
        )

        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]


class TestAuthenticatedEndpoints:

    def test_get_me_authenticated(self, authenticated_client_with_user):
        client, user_data = authenticated_client_with_user

        response = client.get("/users/me")

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == user_data["username"]
        assert data["id"] == user_data["id"]

    def test_get_me_no_token(self, client: TestClient):
        response = client.get("/users/me")

        assert response.status_code == 401

    def test_get_me_invalid_token(self, client: TestClient):
        client.headers["Authorization"] = "Bearer invalid_token"
        response = client.get("/users/me")

        assert response.status_code == 401


class TestTokenRefresh:

    async def test_refresh_token_success(self, client: TestClient):
        client.post(
            "/users/register",
            json={"username": "refreshuser", "password": "RefreshPassword123"},
        )

        login_response = client.post(
            "/users/login",
            json={"username": "refreshuser", "password": "RefreshPassword123"},
        )

        tokens = login_response.json()["tokens"]
        old_access_token = tokens["accessToken"]

        assert tokens["refreshToken"] == ""  # Refresh token is in cookie

        assert "refreshToken" in login_response.headers["set-cookie"]

        refresh_token = login_response.cookies.get("refreshToken")
        assert refresh_token is not None

        await asyncio.sleep(1.1)  # jwt creation needs second difference

        client.cookies.set("refreshToken", refresh_token)
        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "tokens" in data
        assert "accessToken" in data["tokens"]
        assert "refreshToken" in data["tokens"]

        new_access_token = data["tokens"]["accessToken"]
        assert data["tokens"]["refreshToken"] == ""
        assert new_access_token is not None
        assert new_access_token != old_access_token

        new_refresh_cookie = response.cookies.get("refreshToken")
        assert new_refresh_cookie is not None

    def test_refresh_with_invalid_token(self, client: TestClient):
        client.cookies.set("refreshToken", "invalid_refresh_token")
        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid refresh token"

    def test_refresh_without_token(self, client: TestClient):
        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Refresh token missing"

    async def test_refresh_with_stale_token(self, client: TestClient):
        client.post(
            "/users/register",
            json={"username": "revokeduser", "password": "RevokedPassword123"},
        )

        login_response = client.post(
            "/users/login",
            json={"username": "revokeduser", "password": "RevokedPassword123"},
        )

        refresh_token = login_response.cookies.get("refreshToken")

        client.cookies.set("refreshToken", refresh_token)

        await asyncio.sleep(1.1)

        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )  # set new token in server
        assert response.status_code == 200

        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )  # old token, but valid sid
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid refresh hash"

    def test_refresh_without_session(self, client: TestClient):
        client.post(
            "/users/register",
            json={"username": "revokeduser", "password": "RevokedPassword123"},
        )

        login_response = client.post(
            "/users/login",
            json={"username": "revokeduser", "password": "RevokedPassword123"},
        )

        refresh_token = login_response.cookies.get("refreshToken")

        client.cookies.set("refreshToken", refresh_token)

        response = client.post(
            "/users/logout", headers={"X-Requested-With": "XMLHttpRequest"}
        )  # revoke session
        assert response.status_code == 200

        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )  # good token but no session
        assert response.status_code == 401
        assert response.json()["detail"] == "Session revoked"

    @patch("app.routers.user.datetime")
    def test_refresh_expired_session(
        self,
        mock_datetime: MagicMock,
        client: TestClient,
    ):

        future_time = datetime.now(timezone.utc) + timedelta(days=365)
        mock_datetime.now.return_value = future_time

        client.post(
            "/users/register",
            json={"username": "expiryuser", "password": "Password123"},
        )
        login_res = client.post(
            "/users/login", json={"username": "expiryuser", "password": "Password123"}
        )

        refresh_token = login_res.cookies.get("refreshToken")
        client.cookies.set("refreshToken", refresh_token)

        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )
        print(response.json())
        assert response.status_code == 401
        assert response.json()["detail"] == "Session expired"


class TestLogout:

    def test_logout_success(self, client: TestClient):

        client.post(
            "/users/register",
            json={"username": "logoutuser", "password": "LogoutPassword123"},
        )

        login_response = client.post(
            "/users/login",
            json={"username": "logoutuser", "password": "LogoutPassword123"},
        )

        # server send cookie adding intent
        assert "refreshToken" in login_response.headers["set-cookie"]
        assert "Max-Age=0" not in login_response.headers["set-cookie"]

        refresh_cookie = login_response.cookies.get("refreshToken")
        assert refresh_cookie is not None

        # add cookie to client manually
        client.cookies.set("refreshToken", refresh_cookie)

        response = client.post(
            "/users/logout", headers={"X-Requested-With": "XMLHttpRequest"}
        )

        assert response.status_code == 200

        # Server sent cookie deletion intent
        assert "refreshToken" in response.headers["set-cookie"]
        assert "Max-Age=0" in response.headers["set-cookie"]

        # need to manually delete, because client doesn't auto-handle secure cookie deletions
        client.cookies.delete("refreshToken")

        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Refresh token missing"

    def test_logout_with_invalid_token(self, client: TestClient):
        client.cookies.set("refreshToken", "SomeInvalidToken")
        response = client.post(
            "/users/logout", headers={"X-Requested-With": "XMLHttpRequest"}
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid refresh token"

    def test_logout_without_token(self, client: TestClient):
        response = client.post(
            "/users/logout", headers={"X-Requested-With": "XMLHttpRequest"}
        )

        assert response.status_code == 401
        assert response.json()["detail"] == "Missing refresh token"

    async def test_logout_with_bad_refresh_hash(self, client: TestClient):
        client.post(
            "/users/register",
            json={"username": "logoutuser", "password": "LogoutPassword123"},
        )

        login_response = client.post(
            "/users/login",
            json={"username": "logoutuser", "password": "LogoutPassword123"},
        )
        refresh_token = login_response.cookies.get("refreshToken")
        client.cookies.set("refreshToken", refresh_token)

        await asyncio.sleep(1.1)

        response = client.post(
            "/users/refresh", headers={"X-Requested-With": "XMLHttpRequest"}
        )  # set new token in server

        new_refresh_token = response.cookies.get("refreshToken")
        assert new_refresh_token is not None
        assert new_refresh_token != refresh_token

        # old refresh token, logout should not care, only about valid sid
        response = client.post(
            "/users/logout", headers={"X-Requested-With": "XMLHttpRequest"}
        )
        assert response.status_code == 200
