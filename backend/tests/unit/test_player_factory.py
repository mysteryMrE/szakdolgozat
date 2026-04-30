from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas.player_type import PlayerType
from app.services.player_factory import PlayerFactory


@pytest.fixture
def factory():
    PlayerFactory.reset_instance()
    yield PlayerFactory()


class TestPlayerFactory:

    def test_register_defaults_registers_every_builtin_type(self, monkeypatch):
        random_creator = object()
        menace_creator = object()
        backprop_creator = object()
        genetic_creator = object()
        human_creator = object()
        minimax_creator = object()

        monkeypatch.setattr(
            "app.services.player_factory.RandomPlayerCreator", lambda: random_creator
        )
        monkeypatch.setattr(
            "app.services.player_factory.MenacePlayerCreator", lambda: menace_creator
        )
        monkeypatch.setattr(
            "app.services.player_factory.BackpropNNCreator", lambda: backprop_creator
        )
        monkeypatch.setattr(
            "app.services.player_factory.GeneticNNCreator", lambda: genetic_creator
        )
        monkeypatch.setattr(
            "app.services.player_factory.HumanPlayerCreator", lambda: human_creator
        )
        monkeypatch.setattr(
            "app.services.player_factory.MinimaxPlayerCreator", lambda: minimax_creator
        )
        PlayerFactory.reset_instance()
        factory = PlayerFactory()

        assert factory._creators[PlayerType.RANDOM] is random_creator
        assert factory._creators[PlayerType.MENACE] is menace_creator
        assert factory._creators[PlayerType.BACKPROP_NN] is backprop_creator
        assert factory._creators[PlayerType.GENETIC_NN] is genetic_creator
        assert factory._creators[PlayerType.HUMAN] is human_creator
        assert factory._creators[PlayerType.MINIMAX] is minimax_creator

    @pytest.mark.parametrize(
        "raw, expected",
        [
            (PlayerType.RANDOM, PlayerType.RANDOM),
            ("random", PlayerType.RANDOM),
            ("not-a-player", None),
            (123, None),
        ],
    )
    def test_normalize_player_type(self, raw, expected):
        assert PlayerFactory._normalize_player_type(raw) == expected

    async def test_create_player_success_with_enum_type(self, monkeypatch):
        monkeypatch.setattr(PlayerFactory, "_register_defaults", lambda self: None)
        PlayerFactory.reset_instance()
        factory = PlayerFactory()

        expected_player = object()
        creator = MagicMock()
        creator.create = AsyncMock(return_value=expected_player)
        factory.register(PlayerType.RANDOM, creator)

        result = await factory.create_player(
            PlayerType.RANDOM, player_id="id-1", player_name="Test"
        )

        assert result is expected_player
        creator.create.assert_awaited_once_with("id-1", "Test")

    async def test_create_player_success_with_string_type(self, monkeypatch):
        monkeypatch.setattr(PlayerFactory, "_register_defaults", lambda self: None)
        PlayerFactory.reset_instance()
        factory = PlayerFactory()

        expected_player = object()
        creator = MagicMock()
        creator.create = AsyncMock(return_value=expected_player)
        factory.register(PlayerType.HUMAN, creator)

        result = await factory.create_player("human")

        assert result is expected_player
        creator.create.assert_awaited_once_with(None, None)

    async def test_create_player_unknown_type_returns_none(self, monkeypatch):
        monkeypatch.setattr(PlayerFactory, "_register_defaults", lambda self: None)
        PlayerFactory.reset_instance()
        factory = PlayerFactory()

        expected_player = object()
        creator = MagicMock()
        creator.create = AsyncMock(return_value=expected_player)
        factory.register(PlayerType.HUMAN, creator)

        result = await factory.create_player(
            "bad-type", player_id="id-1", player_name="Test"
        )

        assert result is None

    async def test_create_player_missing_creator_returns_none(self, monkeypatch):
        monkeypatch.setattr(PlayerFactory, "_register_defaults", lambda self: None)
        PlayerFactory.reset_instance()
        factory = PlayerFactory()

        result = await factory.create_player(
            PlayerType.MINIMAX, player_id="id-1", player_name="Test"
        )

        assert result is None
