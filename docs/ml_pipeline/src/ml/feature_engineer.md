# Feature Engineering Module (`feature_engineer.py`)

## Overview

This module performs feature engineering on stock price data by adding technical indicators using the `pandas_ta` library. Indicators to apply are dynamically loaded from a YAML configuration file, enabling flexible customization without modifying the Python code.

The module also implements robust logging:

- Logs are written locally to a log file (`feature_engineer.log`).
- Key log entries are uploaded in batches to Supabase for centralized monitoring.

## File Location

adHoc_trader/
├── config/
│ └── indicators.yaml # YAML config for indicators
├── ml_pipeline/
│ └── src/
│ └── ml/
│ └── feature_engineer.py # This module

markdown
Copy
Edit

## Key Features

- **Dynamic Indicators**: Reads indicator names and parameters from `config/indicators.yaml`.
- **Flexible & Extensible**: Add, remove, or tweak indicators by editing the YAML file.
- **Robust Logging**: Logs INFO, WARNING, and ERROR messages locally and pushes them to Supabase.
- **Error Handling**: Skips unknown or misconfigured indicators without stopping the pipeline.
- **Data Integrity**: Ensures DataFrame index is a datetime type and drops rows with NaN values resulting from rolling calculations.

## How It Works

1. **Load Config**  
   The YAML file is loaded at runtime to obtain a list of indicators and their parameters.

2. **Iterate Over Indicators**  
   Each indicator is applied by dynamically calling the corresponding `pandas_ta` function with the provided parameters.

3. **Logging**  
   Events during feature engineering (successes, warnings, errors) are logged to a file and collected in-memory.

4. **Upload Logs**  
   After feature engineering completes, all collected log entries are uploaded to Supabase via the `upload_logs_to_supabase()` function.

5. **Return Processed DataFrame**  
   The enriched DataFrame, now containing additional technical indicator columns, is returned for downstream use.

## Configuration File (`indicators.yaml`)

The indicators are defined in a YAML file located at `config/indicators.yaml`.

### Example:

```yaml
indicators:
  - name: sma
    params:
      length: 20
      append: true
  - name: rsi
    params:
      length: 14
      append: true
  - name: macd
    params:
      append: true
name: Name of the indicator function in pandas_ta (e.g., sma, rsi, macd).

params: Dictionary of parameters to pass to the function.

Usage
The primary function is:

python
Copy
Edit
engineer_features(df: pd.DataFrame) -> pd.DataFrame
Input:
A pandas DataFrame with stock price data indexed by datetime. Columns should include at least open, high, low, close, and volume.

Output:
The same DataFrame enriched with technical indicator columns as defined in the YAML config.

Example:
python
Copy
Edit
import pandas as pd
from feature_engineer import engineer_features

df = pd.read_csv("sample_stock_data.csv", index_col=0, parse_dates=True)
df_features = engineer_features(df)
Logging Details
Logs are saved to feature_engineer.log alongside the script.

Log levels used:

INFO for successful indicator additions.

WARNING for unknown indicators.

ERROR for failed indicator applications.

After each run, logs are uploaded to Supabase for central storage and monitoring.

Error Handling
If the input DataFrame is empty, the function raises a ValueError.

Unknown indicators listed in the YAML are skipped with warnings logged.

Exceptions raised by invalid parameters or internal errors during indicator calculation are caught, logged as errors, and the pipeline continues.

Dependencies
Python 3.7+

pandas

pandas_ta

PyYAML

Your Supabase client with an implemented upload_logs_to_supabase() function

