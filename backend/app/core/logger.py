import logging
import sys
from logging.handlers import RotatingFileHandler

"""
WEBSOCKET = 8
DEBUG = 10
TRAINING = 15
INFO = 20
ENDPOINT = 25
WARNING = 30
ERROR = 40
CRITICAL = 50
"""

TRAINING_LEVEL = 15
WEBSOCKET_LEVEL = 8
ENDPOINT_LEVEL = 25

logging.addLevelName(WEBSOCKET_LEVEL, "WEBSOCKET")
logging.addLevelName(ENDPOINT_LEVEL, "ENDPOINT")
logging.addLevelName(TRAINING_LEVEL, "TRAINING")


class AppLogger:
    """
    Logger must be explicitly configured via AppLogger.setup() before use.

    AppLogger() creates a child logger of the main TIC logger.
    (import time, so the parent will first be a placeholder node,
    then after setup there will be a proper parent with level set and handlers)
    """

    _logger_name = "TIC"
    _is_configured = False

    def __init__(self, name: str):
        full_name = f"{self._logger_name}.{name}"
        self._logger = logging.getLogger(full_name)

    def endpoint(self, msg, *args, **kwargs):
        self._logger.log(ENDPOINT_LEVEL, msg, *args, **kwargs)

    def websocket(self, msg, *args, **kwargs):
        self._logger.log(WEBSOCKET_LEVEL, msg, *args, **kwargs)

    def training(self, msg, *args, **kwargs):
        self._logger.log(TRAINING_LEVEL, msg, *args, **kwargs)

    def debug(self, msg, *args, **kwargs):
        self._logger.debug(msg, *args, **kwargs)

    def info(self, msg, *args, **kwargs):
        self._logger.info(msg, *args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        self._logger.warning(msg, *args, **kwargs)

    def error(self, msg, *args, **kwargs):
        self._logger.error(msg, *args, **kwargs)

    def critical(self, msg, *args, **kwargs):
        self._logger.critical(msg, *args, **kwargs)

    def exception(self, msg, *args, **kwargs):
        self._logger.exception(msg, *args, **kwargs)

    @staticmethod
    def setup(
        log_file: str | None = None,
        console_level: str = "WARNING",
        file_level: str = "DEBUG",
    ):
        if AppLogger._is_configured:
            return
        parent_logger = logging.getLogger(AppLogger._logger_name)
        parent_logger.setLevel(WEBSOCKET_LEVEL)
        parent_logger.propagate = False

        parent_logger.handlers.clear()

        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
        )

        if log_file:
            fileHandler = RotatingFileHandler(
                log_file, maxBytes=10 * 1024 * 1024, backupCount=3
            )
            fileHandler.setFormatter(formatter)
            fileHandler.setLevel(file_level)
            parent_logger.addHandler(fileHandler)

        printHandler = logging.StreamHandler(sys.stdout)
        printHandler.setFormatter(formatter)
        printHandler.setLevel(console_level)
        parent_logger.addHandler(printHandler)

        AppLogger._is_configured = True
