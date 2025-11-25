import pandas as pd

path = "ml_data/features/AAPL/intraday/60min/compact/latest.parquet"
print(f"Loading features from {path}...")

df = pd.read_parquet(path)

# Add target: 1-hour forward return
df["target"] = df["close"].shift(-1) / df["close"] - 1

# Drop row with NaN target (last row)
df.dropna(inplace=True)

print(f"Saving updated dataset with 'target' column to {path}")
df.to_parquet(path)

print("✅ Target column added successfully.")
