from fastapi.testclient import TestClient


class TestNetworkCreation:

    def test_create_network_valid(self, authenticated_client: TestClient):
        response = authenticated_client.post(
            "/networks/create_network",
            json={"name": "Test Network", "layers": [18, 12, 9]},
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Network"
        assert data["nn"]["layers"] == [18, 12, 9]
        assert "weights" in data["nn"]
        assert "biases" in data["nn"]

    def test_create_network_invalid_input_layer(self, authenticated_client: TestClient):
        response = authenticated_client.post(
            "/networks/create_network",
            json={"name": "Invalid Network", "layers": [10, 12, 9]},
        )

        assert response.status_code == 422
        assert "input layer must have 18 neurons" in response.json()["detail"]

    def test_create_network_invalid_output_layer(
        self, authenticated_client: TestClient
    ):
        response = authenticated_client.post(
            "/networks/create_network",
            json={"name": "Invalid Network", "layers": [18, 12, 5]},
        )

        assert response.status_code == 422
        assert "output layer must have 9 neurons" in response.json()["detail"]

    def test_create_network_missing_layers(self, authenticated_client: TestClient):
        response = authenticated_client.post(
            "/networks/create_network",
            json={"name": "Invalid Network", "layers": [18]},
        )

        assert response.status_code == 422

    def test_create_network_unauthenticated(self, client: TestClient):
        response = client.post(
            "/networks/create_network",
            json={"name": "Test Network", "layers": [18, 9]},
        )

        assert response.status_code == 401


class TestNetworkListing:

    def test_list_networks_empty(self, authenticated_client: TestClient):
        response = authenticated_client.get("/networks/list_networks")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_networks_with_networks(self, authenticated_client: TestClient):
        authenticated_client.post(
            "/networks/create_network",
            json={"name": "Network 1", "layers": [18, 9]},
        )

        response = authenticated_client.get("/networks/list_networks")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(network["name"] == "Network 1" for network in data)

    def test_list_networks_unauthenticated(self, client: TestClient):
        response = client.get("/networks/list_networks")

        assert response.status_code == 401

    def test_get_network_success(self, authenticated_client: TestClient):
        create_response = authenticated_client.post(
            "/networks/create_network",
            json={"name": "Test Network", "layers": [18, 9]},
        )
        net_id = create_response.json()["id"]
        response = authenticated_client.get(f"/networks/{net_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == net_id
        assert data["name"] == "Test Network"

    def test_get_network_not_found(self, authenticated_client: TestClient):
        """Test getting nonexistent network."""
        response = authenticated_client.get("/networks/nonexistent-id")

        assert response.status_code == 404


class TestNetworkUpdate:

    def test_update_network_name(self, authenticated_client: TestClient):
        create_response = authenticated_client.post(
            "/networks/create_network",
            json={"name": "Original Name", "layers": [18, 9]},
        )
        net_id = create_response.json()["id"]

        response = authenticated_client.put(
            f"/networks/{net_id}", json={"name": "Updated Name"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    def test_update_network_not_found(self, authenticated_client: TestClient):
        """Test updating nonexistent network."""
        response = authenticated_client.put(
            "/networks/nonexistent-id", json={"name": "New Name"}
        )

        assert response.status_code == 404


class TestNetworkDeletion:

    def test_delete_network_success(self, authenticated_client: TestClient):
        create_response = authenticated_client.post(
            "/networks/create_network",
            json={"name": "To Delete", "layers": [18, 9]},
        )
        net_id = create_response.json()["id"]

        response = authenticated_client.delete(f"/networks/{net_id}")

        assert response.status_code == 200

        get_response = authenticated_client.get(f"/networks/{net_id}")
        assert get_response.status_code == 404

    def test_delete_network_not_found(self, authenticated_client: TestClient):
        response = authenticated_client.delete("/networks/nonexistent-id")

        assert response.status_code == 404

    def test_delete_network_unauthenticated(self, client: TestClient):
        response = client.delete("/networks/some-id")

        assert response.status_code == 401
