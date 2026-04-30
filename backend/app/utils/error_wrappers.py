from fastapi import HTTPException, status
from sqlalchemy.exc import (
    IntegrityError,
    TimeoutError as SQLTimeoutError,
    OperationalError,
    SQLAlchemyError,
)
import asyncio
from app.core.logger import AppLogger
from functools import wraps

logger = AppLogger(__name__)


def db_http_handler(db_method, default_message="Internal server error"):
    """
    Creates a wrapper to handle database errors.
    Args:
        db_method: The database method to wrap.
        default_message: The default error message to use with 500 error.
    Returns:
        The wrapped method with error handling. The wrapper expects keyword arguments. The wrapper raises an HTTPException 500 for any error.
    """

    @wraps(db_method)
    async def wrapper(**kwargs):
        """
        Wrapper function to handle database errors.
        Args:
            **kwargs: Keyword arguments to pass to the database method.
        Raises:
            HTTPException: 500 for internal errors.
            HTTPException: 409 for conflicts.
            HTTPException: 503 for database unavailability or timeouts.
        """
        try:
            return await db_method(**kwargs)
        except IntegrityError:
            logger.error("Database integrity error")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Resource already exists or constraint failed.",
            )

        except (SQLTimeoutError, asyncio.TimeoutError):
            logger.error("Database timeout error")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database timed out, please try again",
            )

        except OperationalError:
            logger.error("Database operational error")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database unavailable",
            )

        except SQLAlchemyError as e:
            logger.error(f"Database unknown error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=default_message,
            )

        except Exception as e:
            logger.error(f"Database error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=default_message,
            )

    return wrapper
