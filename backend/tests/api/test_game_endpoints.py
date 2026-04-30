import pytest
from fastapi.testclient import TestClient


class TestDefaultPlayers:

    @pytest.mark.timeout(60)
    def test_get_default_players(self, client: TestClient, test_db_with_defaults):
        response = client.get("/game/default_players")

        assert response.status_code == 200
        data = response.json()
        assert "defaultPlayers" in data

        default_players = data["defaultPlayers"]

        expected_types = [
            "menace",
            "backprop_nn",
            "genetic_nn",
            "random",
            "minimax",
            "human",
        ]
        for player_type in expected_types:
            assert player_type in default_players
            player = default_players[player_type]
            assert "id" in player
            assert "name" in player
            assert "type" in player
            assert player["type"] == player_type
