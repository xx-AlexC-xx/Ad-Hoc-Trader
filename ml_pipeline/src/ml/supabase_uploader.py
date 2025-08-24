"""Module that uploads stock market data to Supabase from Alpha Vantage."""

import logging
import os
from datetime import datetime, timezone
from requests.exceptions import RequestException
from dotenv import load_dotenv
import pandas as pd
from supabase import create_client, Client


# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")
TABLE_NAME = "stock_prices"


class SupabaseUploadError(Exception):
    """Raised when Supabase data upload fails."""


if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("❌ Missing Supabase credentials. Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


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
