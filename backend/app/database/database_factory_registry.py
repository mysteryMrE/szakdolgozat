from .database_factory_interface import DatabaseFactory
from .concrete_factories import PostgreSQLFactory
from .database_gateway_interface import DatabaseGateway


class DatabaseFactoryRegistry:
    """
    Registry for database factories.

    Manages registration, retrieval of database factories and creation of database daos.
    """

    def __init__(self):
        self._factories: list[DatabaseFactory] = []
        self._register_default_factories()

    def _register_default_factories(self):
        self.register_factory(PostgreSQLFactory())

    def register_factory(self, factory: DatabaseFactory) -> None:
        self._factories.append(factory)

    def get_factory(self, backend: str) -> DatabaseFactory:
        for factory in self._factories:
            if factory.supports_database(backend):
                return factory
        raise ValueError(f"No factory found for database backend: {backend}")

    def create_database_gateway(self, backend: str) -> DatabaseGateway:
        factory = self.get_factory(backend)
        config = factory.create_config()
        return factory.create_database_gateway(config)

    def get_supported_backends(self) -> list[str]:
        backends = []
        for factory in self._factories:
            backends.extend(factory.get_supported_names())
        return backends
