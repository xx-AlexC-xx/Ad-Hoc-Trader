"""
Feature Engineering with logging locally and uploading logs to Supabase.
"""

import os
import yaml
import logging
import pandas as pd
import pandas_ta as ta
from datetime import datetime
from supabase_uploader import upload_logs_to_supabase  # Make sure this exists!

# Path to config/indicators.yaml (3 levels up from this file)
CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "config",
    "indicators.yaml",
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
    if not os.path.exists(CONFIG_PATH):
        logging.error(f"Config file not found: {CONFIG_PATH}")
        raise FileNotFoundError(f"Config file not found: {CONFIG_PATH}")

    with open(CONFIG_PATH, "r") as file:
        config = yaml.safe_load(file)

    return config.get("indicators", [])


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
    run_logs = []

    for ind in indicators:
        name = ind.get("name")
        params = ind.get("params", {})

        func = getattr(df.ta, name, None)
        if not func:
            msg = f"Skipping unknown indicator: {name}"
            logging.warning(msg)
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
            logging.info(msg)
            run_logs.append(
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "INFO",
                    "message": msg,
                }
            )
        except Exception as e:
            msg = f"Failed to add indicator {name}: {e}"
            logging.error(msg)
            run_logs.append(
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "ERROR",
                    "message": msg,
                }
            )

    df.dropna(inplace=True)
    success_msg = f"Engineered features: {df.shape[1]} columns, {len(df)} rows."
    logging.info(success_msg)
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
    except Exception as e:
        logging.error(f"Failed to upload logs to Supabase: {e}")

    return df


# Optional test run
if __name__ == "__main__":
    sample_data = pd.DataFrame(
        {
            "open": [100, 101, 102, 103, 104, 105],
            "high": [101, 102, 103, 104, 105, 106],
            "low": [99, 100, 101, 102, 103, 104],
            "close": [100.5, 101.5, 102.5, 103.5, 104.5, 105.5],
            "volume": [1000, 1100, 1200, 1300, 1400, 1500],
        },
        index=pd.date_range("2023-01-01", periods=6),
    )

    engineer_features(sample_data)
