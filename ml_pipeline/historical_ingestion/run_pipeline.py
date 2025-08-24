"""
run.pipeline.py
This script is the entry point for running the historical stock data ingestion pipeline.
It fetches daily adjusted stock data for a list of symbols, normalizes the data,
and inserts it into a database using Supabase.

"""

import argparse
import time
import logging
from ml_pipeline.historical_ingestion.supabase_client import insert_stock_data
from ml_pipeline.historical_ingestion.ingest_historical import normalize_stock_data
from ml_pipeline.historical_ingestion.alpha_vantage_client import fetch_daily_adjusted
from ml_pipeline.historical_ingestion.config import DEFAULT_SYMBOLS


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)


def run(symbols):
    """
    Main function to run the historical stock data ingestion pipeline

    """
    for symbol in symbols:
        logging.info("⏳ Processing: %s", symbol)
        raw_data = fetch_daily_adjusted(symbol)
        if not raw_data:
            logging.warning("No data returned for %s", symbol)
            continue
        records = normalize_stock_data(symbol, raw_data)
        insert_stock_data(records)
        logging.info("✅ %s: %d records inserted", symbol, len(records))

        time.sleep(12)  # Respect API rate limit


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest historical stock data.")
    parser.add_argument("--symbols", type=str, help="Comma-separated stock symbols")
    args = parser.parse_args()
    selected_symbols = args.symbols.split(",") if args.symbols else DEFAULT_SYMBOLS
    run(selected_symbols)
