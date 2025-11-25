"""Utility helpers for the historical ingestion pipeline."""

from __future__ import annotations

import logging
import time
from functools import wraps
from typing import Any, Callable, Tuple, Type

Retryable = Callable[..., Any]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("ingestion.log"), logging.StreamHandler()],
)


class RetryError(RuntimeError):
    """Raised when a retry-decorated function exhausts all attempts."""


DEFAULT_RETRY_EXCEPTIONS: Tuple[Type[Exception], ...] = (
    ConnectionError,
    TimeoutError,
)


def retry(
    attempts: int = 3,
    delay: int = 5,
    exceptions: Tuple[Type[Exception], ...] | None = None,
) -> Callable[[Retryable], Retryable]:
    """
    Decorator to retry a function when specific exceptions are raised.

    Args:
        attempts: Number of retry attempts before giving up.
        delay: Delay (seconds) between retries.
        exceptions: Exception classes that trigger a retry. Defaults to a
            connection/timeout tuple if not provided.
    """

    handled_exceptions = exceptions or DEFAULT_RETRY_EXCEPTIONS

    def decorator(func: Retryable) -> Retryable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, attempts + 1):
                try:
                    return func(*args, **kwargs)
                except handled_exceptions as exc:  # type: ignore[misc]
                    last_exc = exc
                    logging.warning(
                        "Retry %s/%s for %s failed: %s",
                        attempt,
                        attempts,
                        func.__name__,
                        exc,
                    )
                    if attempt == attempts:
                        break
                    time.sleep(delay)
            raise RetryError(
                f"All {attempts} retries failed for {func.__name__}"
            ) from last_exc

        return wrapper

    return decorator
