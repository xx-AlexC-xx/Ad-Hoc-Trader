"""
Module that localizes and normalizes stock data for ingestion into Supabase.
"""

from datetime import datetime
import logging
import pytz

UTC = pytz.UTC


def normalize_stock_data(symbol, raw_data):
    """
    Normalize Alpha Vantage raw data into rows suitable for database insertion.

    Args:
        symbol (str): Stock symbol.
        raw_data (dict): Raw data returned from Alpha Vantage API.

    Returns:
        list of dict: Normalized rows with parsed and formatted fields.
    """
    rows = []

    for date_str, values in raw_data.items():
        try:
            utc_date = (
                datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=UTC).isoformat()
            )
            row = {
                "symbol": symbol,
                "date": utc_date,
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "adjusted_close": float(values["5. adjusted close"]),
                "volume": int(values["6. volume"]),
                "source": "historical",
                "ingested_at": datetime.now(UTC).isoformat(),
            }
            rows.append(row)
        except (KeyError, ValueError, TypeError) as err:
            logging.error("Data normalization error: %s", err, exc_info=True)

    return rows
