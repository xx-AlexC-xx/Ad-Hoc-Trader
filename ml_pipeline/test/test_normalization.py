"""
test-normalization.py
This test module verifies the correctness of the `normalize_stock_data`
function used in the historical data ingestion pipeline.

---
"""

from historical_ingestion.ingest_historical import normalize_stock_data


def test_normalize_stock_data():
    """from ingest_historical_data import normalize_stock_data
    The function normalize_stock_data(symbol, raw_data) is expected to
    normalize historical stock price data into a structured format.
    """

    raw = {
        "2024-07-25": {
            "1. open": "200.00",
            "2. high": "205.00",
            "3. low": "198.00",
            "4. close": "202.00",
            "5. adjusted close": "202.00",
            "6. volume": "15000000",
        }
    }
    symbol = "TEST"
    result = normalize_stock_data(symbol, raw)
    assert len(result) == 1
    row = result[0]
    assert row["symbol"] == "TEST"
    assert row["open"] == 200.00
    assert row["adjusted_close"] == 202.00
    assert "date" in row
