"""
Feature Engineering: Adds technical indicators using pandas-ta to stock price data.
"""

import pandas as pd
import pandas_ta as ta


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Adds technical indicators to stock price DataFrame."""
    if df.empty:
        raise ValueError("Cannot engineer features on an empty DataFrame")

    df = df.copy()

    # Ensure index is datetime for indicators to work properly
    if not pd.api.types.is_datetime64_any_dtype(df.index):
        df.index = pd.to_datetime(df.index)

    # Add indicators
    df.ta.sma(length=20, append=True)  # Simple Moving Average
    df.ta.ema(length=20, append=True)  # Exponential Moving Average
    df.ta.rsi(length=14, append=True)  # Relative Strength Index
    df.ta.macd(append=True)  # MACD
    df.ta.bbands(length=20, append=True)  # Bollinger Bands
    df.ta.obv(append=True)  # On-Balance Volume
    df.ta.adx(length=14, append=True)  # Average Directional Index

    # Drop rows with NaN created by rolling calculations
    df.dropna(inplace=True)

    print(f"✅ Engineered features: {df.shape[1]} columns, {len(df)} rows.")
    return df
