"""
Fetch stock data from Alpha Vantage API and upload/save via CLI.
"""

from __future__ import annotations

import argparse
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

import pandas as pd
import requests

from ml_pipeline.historical_ingestion.utils import retry
from .config import ALPHA_VANTAGE_API_KEY, validate_required_settings
from .dataset_manager import (
    DEFAULT_VERSION,
    ensure_data_dirs,
    load_dataset as load_cached_dataset,
    save_dataset as cache_dataset,
)
from .supabase_uploader import upload_to_supabase

API_KEY = ALPHA_VANTAGE_API_KEY
BASE_URL = "https://www.alphavantage.co/query"

logger = logging.getLogger(__name__)

MODE_CONFIG = {
    "intraday": {
        "function": "TIME_SERIES_INTRADAY",
        "response_key": lambda interval: f"Time Series ({interval})",
    },
    "daily": {
        "function": "TIME_SERIES_DAILY_ADJUSTED",
        "response_key": lambda _interval: "Time Series (Daily)",
    },
}

COLUMN_MAPPING = {
    "1. open": "open",
    "2. high": "high",
    "3. low": "low",
    "4. close": "close",
    "5. volume": "volume",
    "5. adjusted close": "adjusted_close",
    "6. volume": "volume",
    "7. dividend amount": "dividend_amount",
    "8. split coefficient": "split_coefficient",
}


class AlphaVantageError(Exception):
    """Base Alpha Vantage error."""


class AlphaVantageRateLimitError(AlphaVantageError):
    """Raised when Alpha Vantage rate limits the request."""


def _normalize_dataframe(raw_series: Dict[str, Dict[str, Any]]) -> pd.DataFrame:
    df = pd.DataFrame.from_dict(raw_series, orient="index")
    df.rename(
        columns={k: v for k, v in COLUMN_MAPPING.items() if k in df.columns},
        inplace=True,
    )
    df = df.apply(lambda col: pd.to_numeric(col, errors="coerce"))
    df.index = pd.to_datetime(df.index)
    df.sort_index(inplace=True)
    return df


@retry(
    attempts=3,
    delay=20,
    exceptions=(AlphaVantageRateLimitError, requests.RequestException),
)
def fetch_stock_data(
    ticker: str,
    mode: str = "intraday",
    interval: str = "60min",
    outputsize: str = "compact",
) -> pd.DataFrame:
    """Fetch stock data from Alpha Vantage for a given symbol and mode."""
    if not API_KEY:
        raise EnvironmentError("Missing ALPHA_VANTAGE_API_KEY in environment variables.")

    mode = mode.lower()
    if mode not in MODE_CONFIG:
        raise ValueError(f"Unsupported mode '{mode}'. Valid options: {list(MODE_CONFIG)}")

    logger.info("📡 Fetching %s data for %s...", mode, ticker)
    params = {
        "function": MODE_CONFIG[mode]["function"],
        "symbol": ticker,
        "apikey": API_KEY,
        "outputsize": outputsize,
    }
    if mode == "intraday":
        params["interval"] = interval

    response = requests.get(BASE_URL, params=params, timeout=15)
    response.raise_for_status()
    raw_data = response.json()

    if "Note" in raw_data:
        raise AlphaVantageRateLimitError(raw_data["Note"])
    if "Error Message" in raw_data:
        raise AlphaVantageError(raw_data["Error Message"])

    key = MODE_CONFIG[mode]["response_key"](interval)
    if key not in raw_data:
        raise AlphaVantageError(f"Response missing expected key '{key}': {raw_data}")

    df = _normalize_dataframe(raw_data[key])
    logger.info("✅ Retrieved %d rows (%s -> %s)", len(df), df.index.min(), df.index.max())
    return df


def save_dataframe(df: pd.DataFrame, output_path: str) -> Path:
    """Persist DataFrame to CSV or Parquet."""
    path = Path(output_path).expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix.lower() == ".csv":
        df.to_csv(path)
    elif path.suffix.lower() in {".parquet", ".pq"}:
        df.to_parquet(path)
    else:
        raise ValueError(f"Unsupported file format for {path}")
    logger.info("Saved %d rows to %s", len(df), path)
    return path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch stock data from Alpha Vantage.")
    parser.add_argument("--symbol", required=True, help="Ticker symbol to fetch (e.g., AAPL).")
    parser.add_argument(
        "--mode",
        choices=list(MODE_CONFIG.keys()),
        default="intraday",
        help="Data mode to fetch (intraday or daily).",
    )
    parser.add_argument(
        "--interval",
        default="60min",
        help="Interval for intraday mode (ignored for daily).",
    )
    parser.add_argument(
        "--outputsize",
        choices=["compact", "full"],
        default="compact",
        help="Alpha Vantage output size.",
    )
    parser.add_argument(
        "--output",
        help="Optional path to save the fetched data (CSV or Parquet).",
    )
    parser.add_argument(
        "--upload",
        action="store_true",
        help="Upload the fetched data to Supabase.",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Skip loading/saving datasets to the local cache.",
    )
    parser.add_argument(
        "--force-refresh",
        action="store_true",
        help="Ignore cached data and fetch from Alpha Vantage.",
    )
    parser.add_argument(
        "--load-version",
        help="Load a specific cached version instead of the latest.",
    )
    parser.add_argument(
        "--cache-version",
        help="Custom version label when caching the dataset.",
    )
    return parser.parse_args()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    args = parse_args()
    validate_required_settings()
    ensure_data_dirs()

    cache_kwargs = {
        "dataset_type": "raw",
        "symbol": args.symbol,
        "mode": args.mode,
        "interval": args.interval if args.mode == "intraday" else None,
        "outputsize": args.outputsize,
    }

    df = None
    if not args.no_cache and not args.force_refresh:
        cached = load_cached_dataset(
            version=args.load_version or DEFAULT_VERSION,
            **cache_kwargs,
        )
        if cached is not None:
            logger.info(
                "Loaded %d cached rows for %s (%s).",
                len(cached),
                args.symbol,
                args.load_version or DEFAULT_VERSION,
            )
            df = cached

    if df is None:
        try:
            df = fetch_stock_data(
                ticker=args.symbol,
                mode=args.mode,
                interval=args.interval,
                outputsize=args.outputsize,
            )
        except AlphaVantageRateLimitError as rate_err:
            logger.error("Rate limit hit: %s", rate_err)
            return
        except AlphaVantageError as alpha_err:
            logger.error("Alpha Vantage error: %s", alpha_err)
            return
        except Exception as exc:  # pylint: disable=broad-except
            logger.error("Unexpected error fetching data: %s", exc)
            return
        if df.empty:
            logger.warning("No data returned for %s", args.symbol)
            return
        if not args.no_cache:
            cache_version = args.cache_version or datetime.utcnow().strftime("%Y%m%d%H%M%S")
            cache_path = cache_dataset(
                df,
                version=cache_version,
                **cache_kwargs,
            )
            logger.info("Cached dataset at %s", cache_path)

    if args.output:
        save_dataframe(df, args.output)
    if args.upload:
        upload_to_supabase(df, args.symbol)

    logger.info("Preview:\n%s\n%s", df.head(), df.tail())


if __name__ == "__main__":
    main()
