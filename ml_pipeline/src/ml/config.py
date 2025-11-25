"""
Centralized configuration for the ML pipeline.

Loads environment variables once and exposes shared paths/keys so both the
real-time and historical ingestion flows stay in sync.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv

# Load environment variables once for the entire ML package.
load_dotenv()


# ----- Paths -----------------------------------------------------------------
ML_MODULE_DIR = Path(__file__).resolve().parent
ML_SRC_DIR = ML_MODULE_DIR.parent
ML_PIPELINE_DIR = ML_SRC_DIR.parent
PROJECT_ROOT = ML_PIPELINE_DIR.parent

CONFIG_DIR = PROJECT_ROOT / "config"
INDICATORS_CONFIG_PATH = Path(
    os.getenv("INDICATORS_CONFIG_PATH", CONFIG_DIR / "indicators.yaml")
).resolve()

# Data storage directories
DATA_STORAGE_DIR = Path(
    os.getenv("ML_DATA_DIR", PROJECT_ROOT / "ml_data")
).resolve()
RAW_DATA_DIR = DATA_STORAGE_DIR / "raw"
FEATURES_DATA_DIR = DATA_STORAGE_DIR / "features"

# Optional S3 storage (disabled unless a bucket is provided)
S3_BUCKET = os.getenv("ML_S3_BUCKET")
S3_PREFIX = os.getenv("ML_S3_PREFIX", "ml_data")
S3_REGION = os.getenv("ML_S3_REGION")
S3_ENDPOINT = os.getenv("ML_S3_ENDPOINT")
USE_S3 = bool(S3_BUCKET)


# ----- External Services -----------------------------------------------------
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY") or os.getenv(
    "ALPHA_VANTAGE_KEY"
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv(
    "SUPABASE_KEY"
)
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Comma-separated list of default ticker symbols to ingest/train on.
DEFAULT_SYMBOLS: List[str] = [
    symbol.strip().upper()
    for symbol in os.getenv("DEFAULT_SYMBOLS", "AAPL,MSFT,GOOG").split(",")
    if symbol.strip()
]


def validate_required_settings() -> None:
    """
    Helper to assert required settings are available.

    Call this early in CLI entry points to surface configuration issues quickly.
    """

    missing = []
    if not ALPHA_VANTAGE_API_KEY:
        missing.append("ALPHA_VANTAGE_API_KEY")
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE (or SUPABASE_KEY)")
    if not INDICATORS_CONFIG_PATH.exists():
        missing.append(f"Indicators config not found at {INDICATORS_CONFIG_PATH}")

    if missing:
        raise EnvironmentError(
            "Missing configuration values: " + ", ".join(missing)
        )
