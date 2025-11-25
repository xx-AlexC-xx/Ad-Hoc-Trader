"""
Feature Engineering with logging locally and uploading logs to Supabase.
"""

from __future__ import annotations

import argparse
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Union

import pandas as pd
import pandas_ta as ta  # pylint: disable=unused-import
import yaml

from .config import INDICATORS_CONFIG_PATH, validate_required_settings
from .dataset_manager import ensure_data_dirs, save_dataset as cache_dataset
from .supabase_uploader import upload_logs_to_supabase

_TA_VALIDATION_FRAME = pd.DataFrame(
    {
        "open": [1.0],
        "high": [1.0],
        "low": [1.0],
        "close": [1.0],
        "volume": [1.0],
    }
)

# Log file in the same directory as this script
LOG_FILE = os.path.join(os.path.dirname(__file__), "feature_engineer.log")

# Configure Python logging to file and console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()],
)


def load_indicators_config():
    """Load indicator settings from YAML config file."""
    if not INDICATORS_CONFIG_PATH.exists():
        logging.error("Config file not found: %s", INDICATORS_CONFIG_PATH)
        raise FileNotFoundError(f"Config file not found: {INDICATORS_CONFIG_PATH}")

    with open(INDICATORS_CONFIG_PATH, "r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    return config.get("indicators", [])


def validate_indicators_config(indicators):
    """
    Ensure indicator definitions include names and exist in pandas_ta.

    Raises:
        ValueError: If any indicator is missing required fields or unavailable.
    """
    invalid_entries = []
    for ind in indicators:
        name = ind.get("name")
        if not name:
            invalid_entries.append("Indicator missing 'name' field.")
            continue

        func = getattr(_TA_VALIDATION_FRAME.ta, name, None)
        if not func:
            invalid_entries.append(f"Unknown pandas_ta indicator '{name}'.")

    if invalid_entries:
        raise ValueError("Invalid indicator configuration: " + "; ".join(invalid_entries))


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Adds technical indicators to stock price DataFrame based on YAML config."""
    if df.empty:
        logging.error("Cannot engineer features on an empty DataFrame")
        raise ValueError("Cannot engineer features on an empty DataFrame")

    df = df.copy()

    # Ensure index is datetime
    if not pd.api.types.is_datetime64_any_dtype(df.index):
        df.index = pd.to_datetime(df.index)

    indicators = load_indicators_config()
    validate_indicators_config(indicators)
    run_logs = []

    for ind in indicators:
        name = ind.get("name")
        params = ind.get("params", {})

        func = getattr(df.ta, name, None)
        if not func:
            msg = f"Skipping unknown indicator: {name}"
            logging.warning("%s", msg)
            run_logs.append(
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "WARNING",
                    "message": msg,
                }
            )
            continue

        try:
            func(**params)
            msg = f"Added indicator: {name} with params {params}"
            logging.info("%s", msg)
            run_logs.append(
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "INFO",
                    "message": msg,
                }
            )
        except Exception as exc:  # pylint: disable=broad-except
            msg = f"Failed to add indicator {name}: {exc}"
            logging.error("%s", msg)
            run_logs.append(
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "ERROR",
                    "message": msg,
                }
            )

    df.dropna(inplace=True)
    success_msg = f"Engineered features: {df.shape[1]} columns, {len(df)} rows."
    logging.info("%s", success_msg)
    run_logs.append(
        {
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "message": success_msg,
        }
    )

    # Upload logs batch to Supabase
    try:
        upload_logs_to_supabase(run_logs)
        logging.info("Uploaded feature engineering logs to Supabase.")
    except Exception as exc:  # pylint: disable=broad-except
        logging.error("Failed to upload logs to Supabase: %s", exc)

    return df


def load_input_dataframe(input_path: Union[str, Path]) -> pd.DataFrame:
    """
    Load a DataFrame from CSV or Parquet.

    Args:
        input_path: Path to the input data file.
    """
    file_path = Path(input_path).expanduser().resolve()
    if not file_path.exists():
        raise FileNotFoundError(f"Input file not found: {file_path}")

    if file_path.suffix.lower() in {".csv"}:
        df = pd.read_csv(file_path)
    elif file_path.suffix.lower() in {".parquet", ".pq"}:
        df = pd.read_parquet(file_path)
    else:
        raise ValueError(f"Unsupported file format: {file_path.suffix}")

    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df.set_index("timestamp", inplace=True)
    elif "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)

    return df


def save_output_dataframe(df: pd.DataFrame, output_path: Union[str, Path]) -> None:
    """
    Persist engineered features to CSV or Parquet.

    Args:
        df: DataFrame with engineered indicators.
        output_path: Destination file path.
    """
    file_path = Path(output_path).expanduser().resolve()
    file_path.parent.mkdir(parents=True, exist_ok=True)

    if file_path.suffix.lower() in {".csv"}:
        df.to_csv(file_path)
    elif file_path.suffix.lower() in {".parquet", ".pq"}:
        df.to_parquet(file_path)
    else:
        raise ValueError(f"Unsupported output format: {file_path.suffix}")

    logging.info("Saved engineered features to %s", file_path)


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for the feature engineering pipeline."""
    parser = argparse.ArgumentParser(
        description="Run feature engineering on stock price data."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to input CSV or Parquet file containing OHLCV data.",
    )
    parser.add_argument(
        "--output",
        required=False,
        help="Optional path to store engineered features (CSV or Parquet).",
    )
    parser.add_argument(
        "--symbol",
        help="Ticker symbol used for caching the engineered dataset.",
    )
    parser.add_argument(
        "--mode",
        default="intraday",
        help="Mode label for caching (e.g., intraday, daily).",
    )
    parser.add_argument(
        "--interval",
        default="60min",
        help="Interval tag used during ingestion (ignored for daily).",
    )
    parser.add_argument(
        "--outputsize",
        default="compact",
        help="Output size tag used during ingestion (compact or full).",
    )
    parser.add_argument(
        "--cache-version",
        help="Optional custom version label when saving to the cache.",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Skip saving engineered features to the local/S3 cache.",
    )
    parser.add_argument(
        "--head",
        action="store_true",
        help="Print head/tail of engineered data even if output is saved.",
    )
    return parser.parse_args()


def main() -> None:
    """CLI entry point to engineer features on a local dataset."""
    args = parse_args()
    validate_required_settings()

    logging.info("Loading data from %s", args.input)
    source_df = load_input_dataframe(args.input)
    logging.info("Loaded %d rows with %d columns", len(source_df), source_df.shape[1])

    engineered = engineer_features(source_df)

    cache_enabled = not args.no_cache and args.symbol
    if cache_enabled:
        ensure_data_dirs()
        cache_version = args.cache_version or datetime.utcnow().strftime("%Y%m%d%H%M%S")
        cache_path = cache_dataset(
            engineered,
            dataset_type="features",
            symbol=args.symbol,
            mode=args.mode,
            interval=args.interval if args.mode == "intraday" else None,
            outputsize=args.outputsize,
            version=cache_version,
        )
        logging.info("Cached engineered features to %s", cache_path)
    elif not args.no_cache:
        logging.warning("Skipping cache save because --symbol was not provided.")

    if args.output:
        save_output_dataframe(engineered, args.output)
    if args.output is None or args.head:
        print(engineered.head())
        print(engineered.tail())


if __name__ == "__main__":
    main()
