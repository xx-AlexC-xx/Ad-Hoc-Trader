alpha_vanatage_client.py
This module provides functionality to fetch daily adjusted stock price data from the Alpha Vantage API. It is used in data ingestion pipelines to retrieve full historical stock data for one or more symbols.

📦 Dependencies
requests

ml_pipeline.historical_ingestion.config (for ALPHA_VANTAGE_API_KEY)

🔧 Functions
fetch_daily_adjusted(symbol: str) -> dict
Fetches daily adjusted time series data for a given stock ticker symbol.

Parameters
symbol (str): Ticker symbol of the stock (e.g., "AAPL", "TSLA").

Returns
dict: Time series data keyed by date. Returns an empty dict if the request fails or no data is available.

Raises
requests.RequestException: If there’s a network or HTTP error.

🧠 Example Usage
from alpha_vanatage_client import fetch_daily_adjusted
data = fetch_daily_adjusted("AAPL")
print(data["2023-08-01"])


📁 Location
bash
Copy
Edit
ml_pipeline/
├── historical_ingestion/
│   └── alpha_vanatage_client.py
