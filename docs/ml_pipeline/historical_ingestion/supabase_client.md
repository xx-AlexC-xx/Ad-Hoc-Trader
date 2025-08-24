# supabase_client.py

This module provides functionality to interact with Supabase for inserting stock data records into a database.

---

## Supabase Client Initialization

- Uses the `create_client` method from the Supabase Python SDK to create a client instance.
- Credentials (`SUPABASE_URL` and `SUPABASE_KEY`) are imported from the configuration module.

---

## Function: `insert_stock_data(records)`

Inserts stock data records into the Supabase `stock_prices` table in batches.

### Parameters

- `records` (`list[dict]`): List of dictionaries, each representing a stock data row to insert.

### Behavior

- If `records` is empty or `None`, the function returns immediately without action.
- Inserts data in batches of 100 records to handle large datasets efficiently.
- Catches and logs errors such as HTTP errors, value errors, or type errors during insertion.

### Exceptions

- Raises `ValueError` if input is not a list (implicitly checked).
- Handles Supabase-specific errors (via HTTPError) gracefully by printing an error message.

---

## Dependencies

- `httpx.HTTPError`
- `supabase` (Python SDK)
- Configuration variables `SUPABASE_URL`, `SUPABASE_KEY`

---

## Usage

This function is typically called by the ingestion pipeline after data normalization to persist stock price records.

---

## Notes

- Adjust batch size if needed depending on API limits or performance considerations.
- Replace generic error handling with specific Supabase exceptions if available for more granular control.