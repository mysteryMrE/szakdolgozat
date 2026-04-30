import asyncio
from app.services.singleton import Singleton
from app.core.config import config
from concurrent.futures import ProcessPoolExecutor
import multiprocessing
from app.core.logger import AppLogger

logger = AppLogger(__name__)


class ResourceManager(metaclass=Singleton):
    """
    Singleton class that manages system resources.
    """

    def __init__(self):
        self.semaphore: asyncio.Semaphore | None = None
        self.process_pool: ProcessPoolExecutor | None = None

    def get_semaphore_strict(self):
        if self.semaphore is None:
            raise RuntimeError(
                "ResourceManager not started or semaphore not initialized."
            )
        return self.semaphore

    async def run_blocking_task(self, func, *args, **kwargs):
        async with self.get_semaphore_strict():
            return await asyncio.to_thread(func, *args, **kwargs)

    def start(self):
        if self.process_pool is not None:
            logger.warning(
                "[RESOURCE MANAGER] Attempted to start ResourceManager, but it is already started."
            )
            return
        cpu_count = config.get_cpu_count()
        trainings = config.get_training_process_count()
        logger.info(
            f"[RESOURCE MANAGER] System CPU count: {cpu_count}, reserved for training: {trainings}"
        )
        remaining_cpus = max(cpu_count - trainings, 1)
        over_provision = config.get_resource_over_provision()
        self.process_pool = ProcessPoolExecutor(
            max_workers=remaining_cpus, mp_context=multiprocessing.get_context("spawn")
        )
        self.semaphore = asyncio.Semaphore(remaining_cpus * over_provision)
        logger.info(
            f"[RESOURCE MANAGER] Initialized with semaphore count: {self.semaphore._value}"
        )

    def shutdown(self):
        if self.process_pool:
            logger.info("[SHUTDOWN] Terminating process pool immediately...")
            self.process_pool.shutdown(wait=False, cancel_futures=True)
            self.process_pool = None
            self.semaphore = None
            logger.info("[SHUTDOWN] Process pool terminated.")


resources: ResourceManager = ResourceManager.get_instance()
