import logging
import time
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("ingestion.log"), logging.StreamHandler()],
)


def retry(attempts=3, delay=5):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for i in range(attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    logging.warning(
                        f"Retry {i+1}/{attempts} for {func.__name__} failed: {e}"
                    )
                    time.sleep(delay)
            raise Exception(f"All {attempts} retries failed.")

        return wrapper

    return decorator
