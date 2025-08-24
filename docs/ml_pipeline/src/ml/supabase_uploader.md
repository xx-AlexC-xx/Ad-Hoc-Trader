# supabase_uploader.py

📡 **Module for uploading stock market data to Supabase**

---

## 📁 Location
`src/ml/supabase_uploader.py`

---

## 📄 Description

This module:
- Connects to your Supabase database using credentials from `.env`
- Accepts a Pandas DataFrame of stock price data
- Prepares and formats the data
- Uploads it to the `stock_prices` table using **upsert** behavior in batches

---

## ⚙️ Environment Variables Required

| Variable Name         | Description                         |
|-----------------------|-------------------------------------|
| `SUPABASE_URL`        | Your Supabase project API URL       |
| `SUPABASE_SERVICE_ROLE` | Your Supabase service role key    |

**.env file example:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-secret-service-role-key
🧠 Exception
python
Copy
Edit
class SupabaseUploadError(Exception)
Raised when a data upload attempt to Supabase fails.

🚀 Function: upload_to_supabase(df: pd.DataFrame, symbol: str) -> None
Description
Uploads stock price data to the stock_prices table in Supabase.

Parameters
Name	Type	Description
df	pd.DataFrame	DataFrame containing stock data with datetime index
symbol	str	Ticker symbol to label the data (e.g., "AAPL")

Returns
None — Upload is done via side effects (upsert to Supabase)

Raises
SupabaseUploadError if:

the API returns an invalid response

upload fails due to any known issue

ValueError if Supabase credentials are missing

🧱 Data Expectations
Input df (before processing)
Must have a datetime index and the following columns:

open

high

low

close

volume

Output Data Format (after processing):
timestamp (converted from index)

open, high, low, close, volume

symbol (added per function argument)

🔁 Upload Process
Uploads data in chunks of 100 records

Uses upsert() to avoid duplicate entries

Timestamps are converted to ISO 8601 format

🧪 Test Runner
You can test the uploader by running the file directly:

bash
Copy
Edit
python -m src.ml.supabase_uploader
This simulates one row of data for AAPL and uploads it.

🧩 Dependencies
pandas

supabase-py

dotenv

requests

logging

Install with:

bash
Copy
Edit
pip install pandas python-dotenv supabase requests
✅ Logging Example
If successful:

pgsql
Copy
Edit
✅ Uploaded 125 rows for AAPL to Supabase.
If failed:

vbnet
Copy
Edit
ERROR:root:Upload failed due to known error: ...
🔒 Security Note
Never expose your SUPABASE_SERVICE_ROLE in frontend or public repos. It has admin-level permissions. Store securely.

🛠️ Recommended Improvements
Add retry logic with exponential backoff (wrap with retry decorator)

Add schema validation before upload (e.g., with Pydantic or Marshmallow)

🗂️ Related Modules
data_fetcher.py → Fetches stock data

engineer_features.py → Adds technical indicators

supabase_client.py → Alternative insert method for historical data

python
Copy
Edit
