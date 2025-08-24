# Configuration for Historical Ingestion Pipeline

This module provides configuration settings required by the historical data ingestion pipeline.

## Purpose

- Loads environment variables from a `.env` file using `python-dotenv`.
- Provides API keys and default symbols to be used by other modules.

## Environment Variables

| Variable              | Description                          | Default              |
|-----------------------|----------------------------------|----------------------|
| `ALPHA_VANTAGE_API_KEY` | API key for Alpha Vantage service | None (required)      |
| `SUPABASE_URL`        | URL endpoint for Supabase project | None (required)      |
| `SUPABASE_KEY`        | Service role key for Supabase      | None (required)      |
| `DEFAULT_SYMBOLS`     | Comma-separated list of stock symbols to ingest | `"AAPL,MSFT,GOOG"` |

## Usage

The variables are loaded at runtime and accessible as module-level constants:
from config import ALPHA_VANTAGE_API_KEY, DEFAULT_SYMBOLS

Dependencies
python-dotenv for loading environment variables from .env.

