"""
config.py

Configuration settings for the historical ingestion pipeline.

Loads environment variables for API keys and default symbols.

Dependencies:
- python-dotenv (for loading .env variables)
"""

import os
from dotenv import load_dotenv

load_dotenv()

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
DEFAULT_SYMBOLS = os.getenv("DEFAULT_SYMBOLS", "AAPL,MSFT,GOOG").split(",")
