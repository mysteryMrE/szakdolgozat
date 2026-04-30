import pytest
from app.neural_networks import NeuralNetwork
from app.game.players.random import RandomPlayer
from app.game.players.human import HumanPlayer
from app.game.players.neural_network import NeuralNetworkPlayer
from app.game.players.menace import MenacePlayer


@pytest.fixture(autouse=True)
def reset_shared_player_state():
    MenacePlayer.reset_matchboxes()
    yield
    MenacePlayer.reset_matchboxes()


class TestRandomPlayer:

    def test_random_player_initialization(self):
        player = RandomPlayer("RandomBot")
        assert player.get_name() == "RandomBot"
        assert player.get_type() == "random"
        assert player.get_id() == "RandomID"

    async def test_random_player_get_move(self):
        player = RandomPlayer("RandomBot")
        board: list[str | None] = [None] * 9
        move = await player.get_move(board)

        assert 0 <= move <= 8

    async def test_random_player_get_move_from_available(self):
        player = RandomPlayer("RandomBot")
        board: list[str | None] = [
            "X",
            "O",
            "X",
            "O",
            None,
            "X",
            "O",
            "X",
            "O",
        ]
        for _ in range(10):
            move = await player.get_move(board)
            assert move == 4

    async def test_random_player_no_available_moves(self):
        player = RandomPlayer("RandomBot")
        board: list[str | None] = ["X", "O", "X", "O", "X", "X", "O", "X", "O"]

        with pytest.raises(
            ValueError,
            match="Board must have exactly 9 positions with at least one empty spot.",
        ):
            await player.get_move(board)


class TestHumanPlayer:

    def test_human_player_initialization(self):
        player = HumanPlayer()
        assert player.get_name() == "Te"
        assert player.get_type() == "human"
        assert player.get_id() == "HumanID"

    async def test_human_player_get_move_raises_error(self):
        player = HumanPlayer()
        board: list[str | None] = [None] * 9

        with pytest.raises(NotImplementedError):
            await player.get_move(board)


class TestNeuralNetworkPlayer:

    async def test_genetic_player_uses_masked_path(self, monkeypatch):
        network = NeuralNetwork(
            {
                "layers": [18, 9],
                "weights": [[[0.0] * 18 for _ in range(9)]],
                "biases": [[0.0] * 9],
            }
        )
        player = NeuralNetworkPlayer("nn-1", "genetic_nn", network)
        called = {"masked": 0}

        async def fake_masked(board):
            called["masked"] += 1
            return 2

        monkeypatch.setattr(player, "_get_move_masked", fake_masked)

        move = await player.get_move([None] * 9)

        assert move == 2
        assert called["masked"] == 1

    async def test_backprop_player_uses_unmasked_prediction_first(self, monkeypatch):
        network = NeuralNetwork(
            {
                "layers": [18, 9],
                "weights": [[[0.0] * 18 for _ in range(9)]],
                "biases": [[0.0] * 9],
            }
        )
        player = NeuralNetworkPlayer("nn-2", "backprop_nn", network)

        async def forbidden_masked(board):
            raise AssertionError(
                "_get_move_masked should not be called when prediction is valid"
            )

        monkeypatch.setattr(player, "_predict_canonical_move", lambda board, masked: 3)
        monkeypatch.setattr(player, "_get_move_masked", forbidden_masked)

        move = await player.get_move([None] * 9)

        assert move == 3

    async def test_backprop_player_falls_back_to_masked_when_occupied(
        self, monkeypatch
    ):
        network = NeuralNetwork(
            {
                "layers": [18, 9],
                "weights": [[[0.0] * 18 for _ in range(9)]],
                "biases": [[0.0] * 9],
            }
        )
        player = NeuralNetworkPlayer("nn-3", "backprop_nn", network)
        called = {"masked": 0}

        async def fallback_masked(board):
            called["masked"] += 1
            return 6

        monkeypatch.setattr(player, "_predict_canonical_move", lambda board, masked: 0)
        monkeypatch.setattr(player, "_get_move_masked", fallback_masked)

        move = await player.get_move(["X"] + [None] * 8)

        assert move == 6
        assert called["masked"] == 1


class TestMenacePlayer:

    def test_menace_player_initialization(self):
        player = MenacePlayer("m-1", "Menace Bot", {})

        assert player.get_type() == "menace"
        assert player.get_name() == "Menace Bot"
        assert player.get_id() == "m-1"

    async def test_menace_player_returns_mapped_valid_move(self, monkeypatch):
        player = MenacePlayer("m-2", "Menace Bot", {})
        MenacePlayer._matchboxes = {"_________": {2: 3, 5: 20}}

        monkeypatch.setattr(
            "app.game.players.menace.canonical_with_map",
            lambda board: ("_________", (0, 1, 2, 3, 8, 5, 6, 7, 4)),
        )
        monkeypatch.setattr(
            "app.game.players.menace.choose_weighted_move", lambda moves: 8
        )

        move = await player.get_move([None] * 9)

        assert move == 4

    async def test_menace_player_requires_matchboxes(self):
        player = MenacePlayer("m-3", "Menace Bot", {})
        MenacePlayer._matchboxes = None

        with pytest.raises(ValueError, match="MenacePlayer matchboxes not initialized"):
            await player.get_move([None] * 9)
