"""Module that uploads stock market data to Supabase from Alpha Vantage."""

import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client
import pandas as pd


# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")
TABLE_NAME = "stock_prices"

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
                raise Exception("No data returned — possible insert error")

        print(f"✅ Uploaded {len(records)} rows for {symbol} to Supabase.")

    except Exception as e:
        print(f"❌ Error uploading to Supabase: {e}")


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
