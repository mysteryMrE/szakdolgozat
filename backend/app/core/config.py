import os
from pydantic import ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.services.singleton import Singleton


class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    project_name: str = "TicTacToe Backend FastAPI"
    version: str = "2.1.0"
    admin_password: str = ""

    trusted_proxies: str = "*"
    trusted_hosts: str = "*"

    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    cors_methods: str = "GET,POST,PUT,DELETE"
    cors_headers: str = "Content-Type,Authorization"
    cors_credentials: bool = True

    jwt_secret: str = ""
    jwt_alg: str = "HS256"
    access_ttl_seconds: int = 900
    refresh_idle_seconds: int = 604800

    default_menace_id: str = ""
    default_backprop_nn_id: str = ""
    default_genetic_nn_ind_id: str = ""

    max_networks_per_user: int = 3
    max_network_nodes: int = 120
    max_epochs: int = 10000

    rate_limit_enabled: bool = True
    training_process_count: int = 3
    disable_training: bool = False
    disable_periodic_tasks: bool = False
    resource_over_provision: int = 2
    ws_guest_max_connections_per_ip: int = 5

    genetic_pop_total: int = 100
    genetic_islands: int = 5
    genetic_generations: int = 10
    genetic_tournament_size: int = 4
    genetic_initial_mutation_prob: float = 0.2
    genetic_final_mutation_prob: float = 0.05
    genetic_initial_mutation_sigma: float = 0.7
    genetic_final_mutation_sigma: float = 0.15
    genetic_migration_interval: int = 5
    genetic_migrants_per_island: int = 3
    genetic_stagnation_threshold: float = 0.005
    genetic_extinction_threshold: int = 25
    genetic_layer_sizes: list[int] = [18, 24, 11, 9]
    genetic_win_reward: float = 1.0
    genetic_loss_penalty: float = -1.0
    genetic_draw_reward: float = 0.5

    backprop_epochs: int = 1000
    menace_exploration: int = 5000
    menace_exploitation: int = 100000

    db_backend: str = "postgres"
    db_schema: str = "public"

    log_file: str | None = None
    file_log_level: str = "DEBUG"
    console_log_level: str = "WARNING"

    @field_validator(
        "default_menace_id",
        "default_backprop_nn_id",
        "default_genetic_nn_ind_id",
        "admin_password",
        "jwt_secret",
    )
    @classmethod
    def validate_required_ids(cls, value: str, info: ValidationInfo) -> str:
        if not value:
            raise ValueError(f"{info.field_name} must be set in environment variables")
        return value

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        if len(value) < 64:
            raise ValueError("jwt_secret must be at least 64 characters for HS256")
        return value


class AppConfig(metaclass=Singleton):

    def __init__(self):
        self._settings: Settings = Settings()

    def get_log_file(self) -> str | None:
        return self._settings.log_file

    def get_file_log_level(self) -> str:
        return self._settings.file_log_level

    def get_console_log_level(self) -> str:
        return self._settings.console_log_level

    def get_cpu_count(self) -> int:
        return os.cpu_count() or 1

    def get_training_process_count(self) -> int:
        return self._settings.training_process_count

    def get_resource_over_provision(self) -> int:
        return self._settings.resource_over_provision

    def get_project_name(self) -> str:
        return self._settings.project_name

    def get_version(self) -> str:
        return self._settings.version

    def get_admin_password(self) -> str:
        return self._settings.admin_password

    def get_jwt_secret(self) -> str:
        return self._settings.jwt_secret

    def get_jwt_alg(self) -> str:
        return self._settings.jwt_alg

    def get_access_ttl(self) -> int:
        return self._settings.access_ttl_seconds

    def get_refresh_idle(self) -> int:
        return self._settings.refresh_idle_seconds

    def get_trusted_proxies(self) -> list[str]:
        if self._settings.trusted_proxies == "*":
            return ["*"]
        return [
            proxy.strip()
            for proxy in self._settings.trusted_proxies.split(",")
            if proxy.strip()
        ]

    def get_allowed_hostnames(self) -> list[str]:
        if self._settings.trusted_hosts == "*":
            return ["*"]
        return [
            host.strip()
            for host in self._settings.trusted_hosts.split(",")
            if host.strip()
        ]

    def get_cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self._settings.cors_origins.split(",")
            if origin.strip()
        ]

    def get_cors_credentials(self) -> bool:
        return self._settings.cors_credentials

    def get_cors_methods(self) -> list[str]:
        if self._settings.cors_methods == "*":
            return ["*"]
        return [
            method.strip()
            for method in self._settings.cors_methods.split(",")
            if method.strip()
        ]

    def get_cors_headers(self) -> list[str]:
        if self._settings.cors_headers == "*":
            return ["*"]
        return [
            header.strip()
            for header in self._settings.cors_headers.split(",")
            if header.strip()
        ]

    def get_default_menace_id(self) -> str:
        return self._settings.default_menace_id

    def get_default_backprop_nn_id(self) -> str:
        return self._settings.default_backprop_nn_id

    def get_default_genetic_nn_ind_id(self) -> str:
        return self._settings.default_genetic_nn_ind_id

    def get_max_networks_per_user(self) -> int:
        return self._settings.max_networks_per_user

    def get_max_network_nodes(self) -> int:
        return self._settings.max_network_nodes

    def get_max_epochs(self) -> int:
        return self._settings.max_epochs

    def get_rate_limit_enabled(self) -> bool:
        return self._settings.rate_limit_enabled

    def get_disable_training(self) -> bool:
        return self._settings.disable_training

    def get_disable_periodic_tasks(self) -> bool:
        return self._settings.disable_periodic_tasks

    def get_ws_guest_max_connections_per_ip(self) -> int:
        return self._settings.ws_guest_max_connections_per_ip

    def get_genetic_pop_total(self) -> int:
        return self._settings.genetic_pop_total

    def get_genetic_islands(self) -> int:
        return self._settings.genetic_islands

    def get_genetic_generations(self) -> int:
        return self._settings.genetic_generations

    def get_genetic_elite_per_island(self) -> int:
        return max(
            2,
            self._settings.genetic_pop_total // self._settings.genetic_islands // 6,
        )

    def get_genetic_tournament_size(self) -> int:
        return self._settings.genetic_tournament_size

    def get_genetic_initial_mutation_prob(self) -> float:
        return self._settings.genetic_initial_mutation_prob

    def get_genetic_final_mutation_prob(self) -> float:
        return self._settings.genetic_final_mutation_prob

    def get_genetic_initial_mutation_sigma(self) -> float:
        return self._settings.genetic_initial_mutation_sigma

    def get_genetic_final_mutation_sigma(self) -> float:
        return self._settings.genetic_final_mutation_sigma

    def get_genetic_migration_interval(self) -> int:
        return self._settings.genetic_migration_interval

    def get_genetic_migrants_per_island(self) -> int:
        return self._settings.genetic_migrants_per_island

    def get_genetic_stagnation_threshold(self) -> float:
        return self._settings.genetic_stagnation_threshold

    def get_genetic_extinction_threshold(self) -> int:
        return self._settings.genetic_extinction_threshold

    def get_genetic_layer_sizes(self) -> list[int]:
        return self._settings.genetic_layer_sizes

    def get_genetic_win_reward(self) -> float:
        return self._settings.genetic_win_reward

    def get_genetic_loss_penalty(self) -> float:
        return self._settings.genetic_loss_penalty

    def get_genetic_draw_reward(self) -> float:
        return self._settings.genetic_draw_reward

    def get_backprop_epochs(self) -> int:
        return self._settings.backprop_epochs

    def get_menace_exploration(self) -> int:
        return self._settings.menace_exploration

    def get_menace_exploitation(self) -> int:
        return self._settings.menace_exploitation

    def get_db_backend(self) -> str:
        return self._settings.db_backend

    def get_db_schema(self) -> str:
        return self._settings.db_schema


class _LazyAppConfig:

    def __getattr__(self, name: str):
        return getattr(AppConfig.get_instance(), name)


config: AppConfig = _LazyAppConfig()  # type: ignore
