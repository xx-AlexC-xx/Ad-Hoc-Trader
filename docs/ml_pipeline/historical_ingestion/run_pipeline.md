# run.pipeline.py

This script serves as the entry point for the historical stock data ingestion pipeline.  
It fetches daily adjusted stock price data for specified stock symbols, normalizes the data, and inserts it into a Supabase database.

---

## Main Function: `run(symbols)`

Processes a list of stock symbols by fetching, normalizing, and storing their historical data.

### Parameters

- `symbols` (`list[str]`): List of stock ticker symbols to process (e.g., `["AAPL", "MSFT"]`).

### Behavior

1. For each symbol:
   - Logs the start of processing.
   - Fetches daily adjusted data from Alpha Vantage.
   - If no data is returned, logs a warning and skips.
   - Normalizes the raw data.
   - Inserts normalized records into the database.
   - Logs the number of records inserted.
2. Waits 12 seconds between requests to comply with API rate limits.

---

## Command Line Usage

Run this script from the command line with optional symbols argument:

```bash
python run.pipeline.py --symbols AAPL,TSLA,MSFT

If no symbols are provided, it defaults to the DEFAULT_SYMBOLS list from the configuration.

Logging
Uses Python's logging module to output info and warning messages during execution.

Dependencies
argparse

time

logging

ml_pipeline.historical_ingestion.supabase_client
ml_pipeline.historical_ingestion.ingest_historical
ml_pipeline.historical_ingestion.alpha_vantage_client
ml_pipeline.historical_ingestion.config

Notes
The 12-second delay between API calls helps avoid hitting Alpha Vantage's rate limits.