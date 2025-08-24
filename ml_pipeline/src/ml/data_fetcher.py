# src/ml/data_fetcher.py
# Test/run use: python -m src.ml.data_fetcher
# fetches Live stock data\uploads to Supabase and returns the larest 5 rows.

"""
Fetch stock data from Alpha Vantage API and upload to Supabase.
"""

import os
import requests
import pandas as pd
from dotenv import load_dotenv
from .supabase_uploader import upload_to_supabase

# Load environment variables
load_dotenv()

API_KEY = os.getenv("ALPHA_VANTAGE_KEY")
BASE_URL = "https://www.alphavantage.co/query"


def fetch_stock_data(
    ticker: str, interval="60min", outputsize="compact"
) -> pd.DataFrame:
    """Fetch intraday stock data from Alpha Vantage for a given symbol."""
    if not API_KEY:
        raise EnvironmentError("Missing ALPHA_VANTAGE_KEY in environment variables.")

    print(f"📡 Fetching data for {ticker}...")

    params = {
        "function": "TIME_SERIES_INTRADAY",
        "symbol": ticker,
        "interval": interval,
        "apikey": API_KEY,
        "outputsize": outputsize,
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        raw_data = response.json()

        key = f"Time Series ({interval})"
        if key not in raw_data:
            raise ValueError(
                f"Time series key not found in response: {raw_data.get('Note') or raw_data}"
            )

        df = pd.DataFrame.from_dict(raw_data[key], orient="index")
        df.columns = ["open", "high", "low", "close", "volume"]
        df = df.astype(float)
        df.index = pd.to_datetime(df.index)
        df.sort_index(inplace=True)

        print(f"✅ {len(df)} rows fetched for {ticker}")
        return df

    except requests.RequestException as e:
        print(f"❌ Request error for {ticker}: {e}")
        return pd.DataFrame()
    except ValueError as e:
        print(f"❌ Data error for {ticker}: {e}")
        return pd.DataFrame()


# Script Entry Point
if __name__ == "__main__":
    SYMBOL = "AAPL"
    stock_df = fetch_stock_data(SYMBOL)
    if not stock_df.empty:
        upload_to_supabase(stock_df, SYMBOL)
        print(stock_df.tail())
