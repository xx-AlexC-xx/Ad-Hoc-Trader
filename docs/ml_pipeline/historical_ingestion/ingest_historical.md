ingest_historical.py

# Stock Data Normalization Module

This module provides functionality to localize and normalize raw stock data from Alpha Vantage for ingestion into a Supabase database.

---

## Function: `normalize_stock_data(symbol, raw_data)`

**Purpose:**  
Transforms raw daily stock data from Alpha Vantage into a list of normalized dictionaries suitable for database insertion.

### Arguments

- `symbol` (`str`): The stock ticker symbol (e.g., "AAPL").
- `raw_data` (`dict`): Raw stock data from Alpha Vantage API, keyed by date strings (e.g., "2023-07-01").

### Returns

- `list[dict]`: A list of normalized records, each with the following fields:
  - `symbol` (`str`): Stock symbol.
  - `date` (`str`): ISO8601 timestamp in UTC.
  - `open` (`float`): Opening price.
  - `high` (`float`): High price.
  - `low` (`float`): Low price.
  - `close` (`float`): Closing price.
  - `adjusted_close` (`float`): Adjusted closing price.
  - `volume` (`int`): Trading volume.
  - `source` (`str`): Data source, hardcoded to `"historical"`.
  - `ingested_at` (`str`): Timestamp when data was normalized (current UTC time in ISO8601).

### Error Handling

- Logs errors if data fields are missing or cannot be converted.

---

## Dependencies

- `datetime`
- `logging`
- `pytz`

---

## Usage Example

```python
from your_module import normalize_stock_data

raw_data = {...}  # Raw Alpha Vantage data dictionary
normalized_rows = normalize_stock_data("AAPL", raw_data)
