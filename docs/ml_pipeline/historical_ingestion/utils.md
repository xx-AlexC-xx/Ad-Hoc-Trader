# Utils Module

This module provides utility functions used during the data ingestion process. It includes:

- Logging configuration
- A retry decorator for fault-tolerant operations

---

## Logging Configuration

The module configures logging to output messages to both a file (`ingestion.log`) and the console.

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler("ingestion.log"), logging.StreamHandler()],
)
Logging Format
Each log entry follows this format:

ruby
Copy
Edit
YYYY-MM-DD HH:MM:SS [LEVEL] Message
retry Decorator
The retry decorator allows retrying a function multiple times if it raises an exception.

python
Copy
Edit
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
Parameters
attempts (int): Number of retry attempts (default is 3).

delay (int): Delay (in seconds) between retries (default is 5).

Usage
python
Copy
Edit
@retry(attempts=5, delay=2)
def fetch_data():
    # Your potentially failing code
    pass
This will try to execute fetch_data() up to 5 times, waiting 2 seconds between attempts.

Example Output
yaml
Copy
Edit
2025-08-04 17:00:00 [WARNING] Retry 1/3 for fetch_data failed: TimeoutError
2025-08-04 17:00:05 [WARNING] Retry 2/3 for fetch_data failed: TimeoutError
2025-08-04 17:00:10 [WARNING] Retry 3/3 for fetch_data failed: TimeoutError
