from app.services.managers.game_manager import GameSessionManager
from app.services.player_factory import PlayerFactory
from app.schemas import GameConfigCreate, GameConfigUpdate, PlayerItem
import random


class TestGameSessionIntegration:

    async def test_create_game_with_human_random(self, player_factory, game_manager):
        manager: GameSessionManager = game_manager
        factory: PlayerFactory = player_factory

        human_player = await factory.create_player("human", "Human Player")
        random_player = await factory.create_player("random", "Random AI")

        config = GameConfigCreate(
            player1=PlayerItem(
                type="human", name="Human Player", id=human_player.get_id()
            ),
            player2=PlayerItem(
                type="random", name="Random AI", id=random_player.get_id()
            ),
            rounds=1,
            auto=False,
            player_delay_ms=100,
            round_delay_ms=100,
        )

        result = await manager.create_game_session("test_user", config)

        assert "error" not in result
        assert result["type"] == "game_created"
        assert "state" in result
        assert "settings" in result

        game = manager.get_game("test_user")
        assert game is not None
        assert game.status == "ongoing"
        assert game.current_turn == "X"
        assert game.player1.get_type() == "human"
        assert game.player2.get_type() == "random"

    async def test_create_game_two_humans_error(self, player_factory, game_manager):
        manager: GameSessionManager = game_manager
        factory: PlayerFactory = player_factory

        human1 = await factory.create_player("human", "Player 1")
        human2 = await factory.create_player("human", "Player 2")

        config = GameConfigCreate(
            player1=PlayerItem(type="human", name="Player 1", id=human1.get_id()),
            player2=PlayerItem(type="human", name="Player 2", id=human2.get_id()),
            rounds=1,
            auto=False,
            player_delay_ms=100,
            round_delay_ms=100,
        )

        result = await manager.create_game_session("test_user", config)

        assert "error" in result

    async def test_create_game_two_bots_no_auto_error(
        self, player_factory, game_manager
    ):
        manager: GameSessionManager = game_manager
        factory: PlayerFactory = player_factory

        random_player = await factory.create_player("random", "Bot 1")
        minimax_player = await factory.create_player("minimax", "Bot 2")

        config = GameConfigCreate(
            player1=PlayerItem(type="random", name="Bot 1", id=random_player.get_id()),
            player2=PlayerItem(
                type="minimax", name="Bot 2", id=minimax_player.get_id()
            ),
            rounds=1,
            auto=False,
            player_delay_ms=100,
            round_delay_ms=100,
        )

        result = await manager.create_game_session("test_user", config)

        assert "error" in result

    async def test_full_game_with_moves(self, game_manager, player_factory):

        manager: GameSessionManager = game_manager
        factory: PlayerFactory = player_factory

        human_player = await factory.create_player("human", "Player")
        random_player = await factory.create_player("random", "AI")

        config = GameConfigCreate(
            player1=PlayerItem(type="human", name="Player", id=human_player.get_id()),
            player2=PlayerItem(type="random", name="AI", id=random_player.get_id()),
            rounds=1,
            auto=False,
            player_delay_ms=0,
            round_delay_ms=0,
        )

        result = await manager.create_game_session("test_user", config)
        assert "error" not in result

        while True:
            game = manager.get_game("test_user")
            if game.status != "ongoing":
                break
            print(game.board)
            empties = [
                (row, col)
                for row in range(3)
                for col in range(3)
                if game.board[row][col] == None
            ]
            row, col = random.choice(empties)
            move_result = manager.process_move("test_user", row * 3 + col, False)
            if "warning" in move_result:
                continue
            assert "error" not in move_result

        game = manager.get_game("test_user")
        assert game.status in ["X_won", "O_won", "draw"]

    async def test_game_update_settings(self, game_manager, player_factory):
        manager: GameSessionManager = game_manager
        factory: PlayerFactory = player_factory

        human_player = await factory.create_player("human", "Player")
        random_player = await factory.create_player("random", "AI")

        config = GameConfigCreate(
            player1=PlayerItem(type="human", name="Player", id=human_player.get_id()),
            player2=PlayerItem(type="random", name="AI", id=random_player.get_id()),
            rounds=3,
            auto=False,
            player_delay_ms=1000,
            round_delay_ms=1000,
        )

        await manager.create_game_session("test_user", config)

        update_config = GameConfigUpdate(
            rounds=5, player_delay_ms=500, round_delay_ms=500
        )

        result = manager.update_game_session("test_user", update_config)

        assert "error" not in result
        assert result["type"] == "game_updated"

        settings = manager.get_game_settings("test_user")
        assert settings.rounds == 5
        assert settings.player_delay_ms == 500
        assert settings.round_delay_ms == 500

    async def test_game_connection_lost(self, game_manager, player_factory):
        manager: GameSessionManager = game_manager
        factory: PlayerFactory = player_factory

        human_player = await factory.create_player("human", "Player")
        random_player = await factory.create_player("random", "AI")

        config = GameConfigCreate(
            player1=PlayerItem(type="human", name="Player", id=human_player.get_id()),
            player2=PlayerItem(type="random", name="AI", id=random_player.get_id()),
            rounds=3,
            auto=False,
            player_delay_ms=100,
            round_delay_ms=100,
        )

        await manager.create_game_session("test_user", config)

        manager.connection_lost("test_user")

        game = manager.get_game("test_user")
        assert "paused" in game.status

    async def test_game_new_round(self, game_manager, player_factory):
        manager: GameSessionManager = game_manager
        factory: PlayerFactory = player_factory

        human_player = await factory.create_player("human", "Player")
        random_player = await factory.create_player("random", "AI")

        config = GameConfigCreate(
            player1=PlayerItem(type="human", name="Player", id=human_player.get_id()),
            player2=PlayerItem(type="random", name="AI", id=random_player.get_id()),
            rounds=3,
            auto=False,
            player_delay_ms=100,
            round_delay_ms=100,
        )

        await manager.create_game_session("test_user", config)

        game = manager.get_game("test_user")
        assert game.curr_round == 1
        assert game.rounds == 3

        game.status = "X_won"
        game.x_wins = 1

        result = manager.start_new_round("test_user")
        assert "error" not in result
        assert "warning" not in result

        game = manager.get_game("test_user")
        assert game.curr_round == 2
        assert game.status == "ongoing"
        assert game.x_wins == 1

    async def test_game_new_round_fail(
        self, game_manager: GameSessionManager, player_factory: PlayerFactory
    ):

        human_player = await player_factory.create_player("human", "Player")
        random_player = await player_factory.create_player("random", "AI")

        config = GameConfigCreate(
            player1=PlayerItem(type="human", name="Player", id=human_player.get_id()),
            player2=PlayerItem(type="random", name="AI", id=random_player.get_id()),
            rounds=3,
            auto=False,
            player_delay_ms=100,
            round_delay_ms=100,
        )

        await game_manager.create_game_session("test_user", config)

        game = game_manager.get_game("test_user")
        assert game.curr_round == 1
        assert game.rounds == 3
        game.curr_round = 3
        game.status = "X_won"

        result = game_manager.start_new_round("test_user")
        assert "error" not in result
        assert "status" in result
        new_result = game_manager.start_new_round("test_user")
        assert "warning" in new_result

        game = game_manager.get_game("test_user")
        assert game.curr_round == 3
        assert game.status == "finished"

    async def test_end_game_session(self, game_manager, player_factory):
        manager: GameSessionManager = game_manager
        factory: PlayerFactory = player_factory

        human_player = await factory.create_player("human", "Player")
        random_player = await factory.create_player("random", "AI")

        config = GameConfigCreate(
            player1=PlayerItem(type="human", name="Player", id=human_player.get_id()),
            player2=PlayerItem(type="random", name="AI", id=random_player.get_id()),
            rounds=1,
            auto=False,
            player_delay_ms=100,
            round_delay_ms=100,
        )

        await manager.create_game_session("test_user", config)
        assert manager.get_game("test_user") is not None

        result = manager._end_game_session("test_user")
        assert result is True

        assert manager.get_game("test_user") is None
