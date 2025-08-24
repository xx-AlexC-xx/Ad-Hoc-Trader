# Test: `test_normalize_stock_data`

This test module verifies the correctness of the `normalize_stock_data` function used in the historical data ingestion pipeline.

---

## Tested Function

```python
from ingest_historical_data import normalize_stock_data
The function normalize_stock_data(symbol, raw_data) is expected to normalize historical stock price data into a structured format.

Test Function
python
Copy
Edit
def test_normalize_stock_data():
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
Test Explanation
Input:

symbol: "TEST"

raw: A dictionary mimicking Alpha Vantage's historical daily price format.

Expected Output:

A list with one normalized dictionary containing:

"symbol" key matching "TEST"

"open" price correctly parsed to float

"adjusted_close" correctly extracted

A "date" field present

Assertions
Assertion	Description
assert len(result) == 1	Confirms a single row is returned
assert row["symbol"] == "TEST"	Ensures the symbol is preserved
assert row["open"] == 200.00	Confirms the open price is correctly parsed
assert row["adjusted_close"] == 202.00	Ensures adjusted close is correct
assert "date" in row	Confirms a date field exists in the normalized row

Notes
This unit test is intended to verify that the transformation logic applied to historical stock data conforms to expected standards. It should be run using a test runner like pytest.

Example Usage
bash
Copy
Edit
pytest test_normalization.py
vbnet
Copy
Edit
