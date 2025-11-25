"""Module that uploads stock market data to Supabase from Alpha Vantage."""

import logging
from datetime import datetime, timezone
from requests.exceptions import RequestException
import pandas as pd
from supabase import create_client, Client

from .config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

TABLE_NAME = "stock_prices"
LOG_TABLE_NAME = "pipeline_logs"
MODEL_METADATA_TABLE = "model_metadata"


class SupabaseUploadError(Exception):
    """Raised when Supabase data upload fails."""


if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("❌ Missing Supabase credentials. Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def upload_to_supabase(df: pd.DataFrame, symbol: str) -> None:
    """Uploads stock market data to Supabase."""
    if df.empty:
        print(f"⚠️ No data to upload for {symbol}")
        return

    df = df.copy()
    df.reset_index(inplace=True)
    df.rename(columns={"index": "timestamp"}, inplace=True)
    df["symbol"] = symbol

    # Convert timestamps to ISO 8601 strings
    df["timestamp"] = df["timestamp"].apply(
        lambda x: x.isoformat() if isinstance(x, (datetime, pd.Timestamp)) else x
    )

    records = df.to_dict(orient="records")

    try:
        for chunk_start in range(0, len(records), 100):
            chunk = records[chunk_start : chunk_start + 100]
            response = supabase.table(TABLE_NAME).upsert(chunk).execute()

            if not response.data:
                raise SupabaseUploadError(
                    "Upload failed to Supabase: invalid response or empty data"
                )

        logging.info("✅ Uploaded %d rows for %s to Supabase.", len(records), symbol)

    except (ValueError, KeyError, RequestException) as e:
        logging.error("Upload failed due to known error: %s", e)
        raise SupabaseUploadError(f"Upload failed due to known error: {e}") from e


def upload_logs_to_supabase(
    logs: list[dict], table_name: str = LOG_TABLE_NAME
) -> None:
    """
    Upload a batch of log dictionaries to Supabase.

    Args:
        logs: List of dictionaries with log metadata (timestamp, level, message, etc.).
        table_name: Destination Supabase table, defaults to pipeline_logs.
    """
    if not logs:
        logging.info("No logs to upload.")
        return

    try:
        for chunk_start in range(0, len(logs), 100):
            chunk = logs[chunk_start : chunk_start + 100]
            response = supabase.table(table_name).insert(chunk).execute()
            if response.error:
                raise SupabaseUploadError(response.error.message)
        logging.info("✅ Uploaded %d log entries to %s.", len(logs), table_name)
    except (ValueError, KeyError, RequestException) as e:
        logging.error("Failed to upload logs to Supabase: %s", e)
        raise SupabaseUploadError(f"Failed to upload logs: {e}") from e


def upload_model_metadata(
    metadata: dict,
    table_name: str = MODEL_METADATA_TABLE,
) -> None:
    """
    Upload model metadata/metrics to Supabase.

    Args:
        metadata: JSON-serializable metadata dictionary.
        table_name: Destination table name (default: model_metadata).
    """
    if not metadata:
        logging.info("No metadata provided for upload.")
        return

    try:
        response = supabase.table(table_name).insert(metadata).execute()
        if response.error:
            raise SupabaseUploadError(response.error.message)
        logging.info("✅ Uploaded model metadata to %s.", table_name)
    except (ValueError, KeyError, RequestException) as e:
        logging.error("Failed to upload model metadata: %s", e)
        raise SupabaseUploadError(f"Failed to upload model metadata: {e}") from e


# Optional test runner
if __name__ == "__main__":
    # Simulate test data
    sample_data = pd.DataFrame(
        [
            {
                "timestamp": datetime.now(timezone.utc),
                "open": 150.25,
                "high": 151.00,
                "low": 149.80,
                "close": 150.75,
                "volume": 105000,
            }
        ]
    )
    sample_data.set_index("timestamp", inplace=True)

    upload_to_supabase(sample_data, symbol="AAPL")
