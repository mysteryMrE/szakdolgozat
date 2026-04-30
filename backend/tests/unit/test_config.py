from app.core.config import AppConfig


class TestAppConfig:

    def test_config_values(self, monkeypatch):
        monkeypatch.setenv("PROJECT_NAME", "TestApp")
        monkeypatch.setenv("VERSION", "1.2.3")
        monkeypatch.setenv("CORS_ORIGINS", "http://example.com")
        monkeypatch.setenv("CORS_CREDENTIALS", "false")
        monkeypatch.setenv("CORS_METHODS", "GET,POST")
        monkeypatch.setenv("CORS_HEADERS", "Content-Type")
        monkeypatch.setenv(
            "JWT_SECRET",
            "bc9fcdbd8aeb479a112aeba1beabb11d39c4c3d930c7a42bf633376fd6925382",
        )
        monkeypatch.setenv("JWT_ALG", "HS512")
        monkeypatch.setenv("ACCESS_TTL_SECONDS", "1800")
        monkeypatch.setenv("REFRESH_IDLE_SECONDS", "1209600")
        monkeypatch.setenv("DEFAULT_MENACE_ID", "menace123")
        monkeypatch.setenv("DEFAULT_BACKPROP_NN_ID", "backprop123")
        monkeypatch.setenv("DEFAULT_GENETIC_NN_POP_ID", "geneticpop123")
        monkeypatch.setenv("DEFAULT_GENETIC_NN_IND_ID", "geneticind123")
        monkeypatch.setenv("GENETIC_POP_TOTAL", "120")
        monkeypatch.setenv("GENETIC_ISLANDS", "6")
        monkeypatch.setenv("GENETIC_GENERATIONS", "30")
        monkeypatch.setenv("GENETIC_TOURNAMENT_SIZE", "5")
        monkeypatch.setenv("GENETIC_INITIAL_MUTATION_PROB", "0.25")
        monkeypatch.setenv("GENETIC_FINAL_MUTATION_PROB", "0.08")
        monkeypatch.setenv("GENETIC_INITIAL_MUTATION_SIGMA", "0.9")
        monkeypatch.setenv("GENETIC_FINAL_MUTATION_SIGMA", "0.2")
        monkeypatch.setenv("GENETIC_MIGRATION_INTERVAL", "7")
        monkeypatch.setenv("GENETIC_MIGRANTS_PER_ISLAND", "4")
        monkeypatch.setenv("GENETIC_STAGNATION_THRESHOLD", "0.01")
        monkeypatch.setenv("GENETIC_EXTINCTION_THRESHOLD", "40")
        monkeypatch.setenv("GENETIC_LAYER_SIZES", "[18, 32, 16, 9]")
        monkeypatch.setenv("GENETIC_WIN_REWARD", "2.0")
        monkeypatch.setenv("GENETIC_LOSS_PENALTY", "-2.0")
        monkeypatch.setenv("GENETIC_DRAW_REWARD", "0.75")
        AppConfig.reset_instance()
        config = AppConfig.get_instance()
        assert config.get_project_name() == "TestApp"
        assert config.get_version() == "1.2.3"
        assert (
            config.get_jwt_secret()
            == "bc9fcdbd8aeb479a112aeba1beabb11d39c4c3d930c7a42bf633376fd6925382"
        )
        assert config.get_jwt_alg() == "HS512"
        assert config.get_access_ttl() == 1800
        assert config.get_refresh_idle() == 1209600
        assert config.get_cors_origins() == ["http://example.com"]
        assert config.get_cors_credentials() is False
        assert config.get_cors_methods() == ["GET", "POST"]
        assert config.get_cors_headers() == ["Content-Type"]
        assert config.get_default_menace_id() == "menace123"
        assert config.get_default_backprop_nn_id() == "backprop123"
        assert config.get_default_genetic_nn_ind_id() == "geneticind123"
        assert config.get_genetic_pop_total() == 120
        assert config.get_genetic_islands() == 6
        assert config.get_genetic_generations() == 30
        assert config.get_genetic_elite_per_island() == 3
        assert config.get_genetic_tournament_size() == 5
        assert config.get_genetic_initial_mutation_prob() == 0.25
        assert config.get_genetic_final_mutation_prob() == 0.08
        assert config.get_genetic_initial_mutation_sigma() == 0.9
        assert config.get_genetic_final_mutation_sigma() == 0.2
        assert config.get_genetic_migration_interval() == 7
        assert config.get_genetic_migrants_per_island() == 4
        assert config.get_genetic_stagnation_threshold() == 0.01
        assert config.get_genetic_extinction_threshold() == 40
        assert config.get_genetic_layer_sizes() == [18, 32, 16, 9]
        assert config.get_genetic_win_reward() == 2.0
        assert config.get_genetic_loss_penalty() == -2.0
        assert config.get_genetic_draw_reward() == 0.75

    def test_singleton_behavior(self):
        config1 = AppConfig.get_instance()
        config2 = AppConfig.get_instance()
        assert config1 is config2

    def test_reset_instance(self):
        config1 = AppConfig.get_instance()
        AppConfig.reset_instance()
        config2 = AppConfig.get_instance()
        assert config1 is not config2
