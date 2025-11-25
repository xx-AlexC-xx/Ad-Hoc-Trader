"""
alpha_vanatage_client.py

This module provides functionality to fetch daily adjusted stock price data
from the Alpha Vantage API. It is designed for use in data ingestion pipelines,
retrieving full historical output for one or more stock symbols.

Functions:
- fetch_daily_adjusted(symbol: str) -> dict:
    Fetches TIME_SERIES_DAILY_ADJUSTED data for a given stock symbol.

Dependencies:
- requests
- config (for API key)
"""

import requests
from ml_pipeline.src.ml.config import ALPHA_VANTAGE_API_KEY


BASE_URL = "https://www.alphavantage.co/query"


def fetch_daily_adjusted(symbol):
    """
    Fetches daily adjusted time series data for a given stock symbol from Alpha Vantage.

    Args:
        symbol (str): The stock ticker symbol (e.g., 'AAPL', 'TSLA').

    Returns:
        dict: A dictionary containing the time series data keyed by date.
              Returns an empty dictionary if the API request fails or no data is available.

    Raises:
        requests.RequestException: If the API request fails due to connectivity or response errors.
    """
    params = {
        "function": "TIME_SERIES_DAILY_ADJUSTED",
        "symbol": symbol,
        "outputsize": "full",
        "apikey": ALPHA_VANTAGE_API_KEY,
    }
    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data.get("Time Series (Daily)", {})
    except requests.RequestException as e:
        print(f"[ERROR] Failed to fetch data for {symbol}: {e}")
        return {}
