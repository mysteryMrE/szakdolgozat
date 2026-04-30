from fastapi.testclient import TestClient

from tests.mocks import FakeJobContext


class TestTrainJobCreation:

    def test_create_train_job_not_authenticated(self, client: TestClient):
        response = client.post(
            "/jobs/train",
            json={
                "networkId": "some-network-id",
                "method": "genetic",
                "params": {"epochs": 10},
            },
        )

        assert response.status_code == 401

    def test_create_train_job_network_not_found(self, authenticated_client: TestClient):
        response = authenticated_client.post(
            "/jobs/train",
            json={
                "networkId": "non-existent-id",
                "method": "genetic",
                "params": {"epochs": 10},
            },
        )

        assert response.status_code == 404
        assert "Network not found" in response.json()["detail"]

    def test_create_train_job_success(
        self,
        mock_job_manager,
        authenticated_client: TestClient,
    ):

        net_res = authenticated_client.post(
            "/networks/create_network", json={"name": "JobTest"}
        )
        network_id = net_res.json()["id"]

        response = authenticated_client.post(
            "/jobs/train",
            json={
                "networkId": network_id,
                "method": "genetic",
                "params": {"epochs": 10},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "queued"

        job_id = data["jobId"]

        assert job_id in mock_job_manager.jobs
        assert mock_job_manager.jobs[job_id].data["networkId"] == network_id


class TestTrainJobStatus:

    def test_get_job_status(
        self, authenticated_client: TestClient, mock_job_manager, test_user
    ):
        job_id = "test-job-123"
        mock_job_manager.jobs[job_id] = FakeJobContext(
            job_id=job_id, user_id=test_user["id"], network_id="some-network"
        )

        response = authenticated_client.get(f"/jobs/train/{job_id}/status")

        assert response.status_code == 200
        assert response.json()["jobId"] == job_id
        assert response.json()["status"] == "queued"

    def test_job_status_not_owner_user(
        self, authenticated_client: TestClient, mock_job_manager
    ):
        job_id = "test-job-123"
        mock_job_manager.jobs[job_id] = FakeJobContext(
            job_id=job_id, user_id="not-the-user", network_id="some-network"
        )

        response = authenticated_client.get(f"/jobs/train/{job_id}/status")
        assert response.status_code == 403

    def test_job_status_not_found(
        self, authenticated_client: TestClient, mock_job_manager, test_user
    ):
        job_id = "test-job-123"
        mock_job_manager.jobs["123"] = FakeJobContext(
            job_id="123", user_id=test_user["id"], network_id="some-network"
        )
        response = authenticated_client.get(f"/jobs/train/{job_id}/status")
        print(mock_job_manager.jobs)
        assert response.status_code == 404

    def test_job_status_not_authenticated(self, client: TestClient, mock_job_manager):
        job_id = "test-job-123"
        mock_job_manager.jobs[job_id] = FakeJobContext(
            job_id=job_id, user_id="does-not-matter", network_id="some-network"
        )
        response = client.get(f"/jobs/train/{job_id}/status")
        assert response.status_code == 401


class TestTrainJobEvents:
    def test_via_real_interaction(self):
        pass  # TODO: Implement event stream tests when feasible


class TestTrainJobValidation:

    def test_train_missing_network_id(self, authenticated_client: TestClient):
        """Test training request missing networkId."""
        response = authenticated_client.post(
            "/jobs/train",
            json={"method": "genetic", "params": {"epochs": 10}},
        )

        assert response.status_code == 422

    def test_train_missing_method(self, authenticated_client: TestClient):
        response = authenticated_client.post(
            "/jobs/train",
            json={"networkId": "some-id", "params": {"epochs": 10}},
        )

        assert response.status_code == 422
