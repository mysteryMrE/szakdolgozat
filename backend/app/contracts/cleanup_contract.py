from typing import Protocol


class PartialCleanable(Protocol):
    async def partial_cleanup(self, *args, **kwargs): ...


class ShutdownCleanable(Protocol):
    async def full_cleanup(self, *args, **kwargs): ...
