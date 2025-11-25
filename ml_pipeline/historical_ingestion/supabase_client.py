"""
supabase_client.py
This module provides a client for interacting with Supabase to insert stock data records.


"""

from httpx import HTTPError
from supabase import create_client, Client
from ml_pipeline.src.ml.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def insert_stock_data(records):
    """
    Insert stock data records into the 'stock_prices' Supabase table in batches of 100.

    Args:
        records (list): A list of dictionaries where each dictionary represents
                        a row of stock data to be inserted.

    Returns:
        None

    Raises:
        ValueError: If the input records are not a list.
        SupabaseException: If an error occurs during insertion
        (replace with actual Supabase error if known).
    """
    if not records:
        return
    try:
        for i in range(0, len(records), 100):
            batch = records[i : i + 100]
            supabase.table("stock_prices").insert(batch).execute()
    except (HTTPError, ValueError, TypeError) as e:
        print(f"[ERROR] Failed to insert batch: {e}")
