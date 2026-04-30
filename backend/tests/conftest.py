import pytest
import os
import uuid
from fastapi.testclient import TestClient
from testcontainers.postgres import PostgresContainer
from tests.mocks import FakeJobManager
from unittest.mock import patch
from app.core.dependencies import get_train_job_manager
from app.core.config import AppConfig
from app.database.database_manager import DatabaseManager
from app.database.concrete_configs.postgres_config import get_postgres_config
from app.core.fastapi_app import create_app


@pytest.fixture(scope="session")
def postgres_dsn():
    with PostgresContainer("postgres:15-alpine", driver="psycopg2") as postgres:
        print(f"Original dsn from testcontainers: {postgres.get_connection_url()}")
        dsn = postgres.get_connection_url().replace("postgresql+psycopg2", "postgresql")
        yield dsn


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment(postgres_dsn):
    os.environ["DB_DSN"] = postgres_dsn
    print("Test environment setup complete with DSN:", postgres_dsn)

    AppConfig.reset_instance()
    DatabaseManager.reset_instance()
    get_postgres_config.cache_clear()
    print("AppConfig instance reset for tests.")
    yield


@pytest.fixture(scope="session")
def app():
    return create_app()


@pytest.fixture(scope="session")
def client(app):
    with TestClient(app) as client:
        yield client


@pytest.fixture(autouse=True)
def reset_client_header_cookie(client):
    yield
    client.headers.pop("Authorization", None)
    client.cookies.clear()


@pytest.fixture
def mock_job_manager(app):
    fake_instance = FakeJobManager()

    app.dependency_overrides[get_train_job_manager] = lambda: fake_instance
    try:
        yield fake_instance
    finally:
        app.dependency_overrides.pop(get_train_job_manager, None)


@pytest.fixture
def training_process_count_1():
    with patch("app.services.managers.train_job_manager.TRAINING_PROCESS_COUNT", 1):
        yield


@pytest.fixture
def training_process_count_2():
    with patch("app.services.managers.train_job_manager.TRAINING_PROCESS_COUNT", 2):
        yield


from app.database import DatabaseManager


@pytest.fixture
def test_db():

    return DatabaseManager.get_instance().get_database()


from app.services.authenticator import Authenticator


@pytest.fixture
def authenticator():

    return Authenticator.get_instance()


from app.services.managers.websocket_manager import WebSocketManager


@pytest.fixture
def ws_manager():
    WebSocketManager.reset_instance()
    return WebSocketManager.get_instance()


from app.services.managers.game_manager import GameSessionManager


@pytest.fixture
def game_manager():
    GameSessionManager.reset_instance()
    return GameSessionManager.get_instance()


from app.services.managers.train_job_manager import TrainingJobManager


@pytest.fixture
def job_manager():
    TrainingJobManager.reset_instance()
    return TrainingJobManager.get_instance()


from app.services.player_factory import PlayerFactory


@pytest.fixture
def player_factory():
    PlayerFactory.reset_instance()
    return PlayerFactory.get_instance()


from app.services.managers.bot_task_manager import BotTaskManager


@pytest.fixture
def bot_manager():
    BotTaskManager.reset_instance()
    return BotTaskManager()


@pytest.fixture
def test_user(client: TestClient):
    user_id = str(uuid.uuid4())
    username = f"testuser{user_id[:8]}"
    password = "123456aA"

    response = client.post(
        "/users/register", json={"username": username, "password": password}
    )
    assert response.status_code == 200
    data = response.json()
    return {"id": data["id"], "username": username, "password": password}


@pytest.fixture
def test_user_with_session(client: TestClient, test_user: dict):
    response = client.post(
        "/users/login",
        json={"username": test_user["username"], "password": test_user["password"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert "tokens" in data
    return {
        **test_user,
        "access_token": data["tokens"]["accessToken"],
        "refresh_token": response.cookies.get("refreshToken"),
    }


@pytest.fixture
def authenticated_client(client: TestClient, test_user_with_session: dict):
    token = test_user_with_session["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    yield client


@pytest.fixture
def authenticated_client_with_user(client: TestClient, test_user_with_session: dict):
    client.headers["Authorization"] = f"Bearer {test_user_with_session['access_token']}"
    return client, test_user_with_session


from app.services.default_player_maker import DefaultPlayerMaker


# AI assisted fix to do async calls on the TestClient's event loop
# with client.portal.call we can avoid the X attached to a different loop issues


@pytest.fixture
def test_db_with_defaults(client: TestClient, test_db: DatabaseManager):
    async def create_defaults():
        await DefaultPlayerMaker.create_menace(exploration=10, exploitation=10)
        await DefaultPlayerMaker.create_backprop_nn(epochs=1)
        await DefaultPlayerMaker.create_genetic_nn()

    try:
        client.portal.call(create_defaults)  # type: ignore
    except Exception as e:
        print(f"Error occurred while creating default players: {e}")
    return test_db
