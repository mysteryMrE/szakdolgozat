from fastapi.testclient import TestClient


class TestSystemEndpoints:

    def test_health_check(self, client: TestClient):
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_root(self, client: TestClient):
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Welcome to MyApp API" in data["message"]

    def test_info(self, client: TestClient):
        response = client.get("/info")

        assert response.status_code == 200
        data = response.json()
        assert "app" in data
        assert "version" in data
        assert "uptime_seconds" in data
        assert isinstance(data["uptime_seconds"], float)
        assert data["uptime_seconds"] >= 0
