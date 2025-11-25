"""
run.pipeline.py
This script is the entry point for running the historical stock data ingestion pipeline.
It fetches daily adjusted stock data for a list of symbols, normalizes the data,
and inserts it into a database using Supabase.

"""

import argparse
import logging
import time
from datetime import datetime

import pandas as pd

from ml_pipeline.historical_ingestion.alpha_vantage_client import fetch_daily_adjusted
from ml_pipeline.historical_ingestion.ingest_historical import normalize_stock_data
from ml_pipeline.historical_ingestion.supabase_client import insert_stock_data
from ml_pipeline.src.ml.config import DEFAULT_SYMBOLS
from ml_pipeline.src.ml.dataset_manager import ensure_data_dirs, save_dataset


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)


def run(symbols):
    """
    Main function to run the historical stock data ingestion pipeline
    """
    ensure_data_dirs()
    for symbol in symbols:
        logging.info("⏳ Processing: %s", symbol)
        raw_data = fetch_daily_adjusted(symbol)
        if not raw_data:
            logging.warning("No data returned for %s", symbol)
            continue
        records = normalize_stock_data(symbol, raw_data)
        if not records:
            logging.warning("No normalized records for %s", symbol)
            continue

        try:
            df_records = pd.DataFrame.from_records(records)
            df_records["date"] = pd.to_datetime(df_records["date"])
            df_records.set_index("date", inplace=True)
            version_tag = datetime.utcnow().strftime("%Y%m%d%H%M%S")
            cache_path = save_dataset(
                df_records,
                dataset_type="raw",
                symbol=symbol,
                mode="daily",
                outputsize="full",
                version=version_tag,
            )
            logging.info("Cached dataset for %s at %s", symbol, cache_path)
        except Exception as exc:  # pylint: disable=broad-except
            logging.warning("Failed to cache dataset for %s: %s", symbol, exc)

        insert_stock_data(records)
        logging.info("✅ %s: %d records inserted", symbol, len(records))

        time.sleep(12)  # Respect API rate limit


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest historical stock data.")
    parser.add_argument("--symbols", type=str, help="Comma-separated stock symbols")
    args = parser.parse_args()
    selected_symbols = args.symbols.split(",") if args.symbols else DEFAULT_SYMBOLS
    run(selected_symbols)
