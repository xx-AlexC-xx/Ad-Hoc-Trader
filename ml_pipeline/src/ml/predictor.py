"""
Run inference with a trained model artifact.

Loads the latest (or specified) model + metadata, pulls engineered features
from cache or a provided path, generates predictions, and can optionally
upsert results into Supabase.
"""

from __future__ import annotations

import argparse
import json
import logging
import pickle
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import pandas as pd

from .config import DATA_STORAGE_DIR
from .dataset_manager import DEFAULT_VERSION, load_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

MODEL_DIR = Path(DATA_STORAGE_DIR / "models").resolve()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run model inference on engineered features.")
    parser.add_argument("--symbol", required=True, help="Ticker symbol used during training.")
    parser.add_argument("--model", default="random_forest", help="Model name directory (e.g., random_forest).")
    parser.add_argument(
        "--artifact-path",
        help="Path to a specific model pickle. Defaults to latest.pkl under models/<symbol>/<model>/.",
    )
    parser.add_argument(
        "--metadata-path",
        help="Path to a specific metadata JSON. Defaults to latest.json under models/<symbol>/<model>/.",
    )
    parser.add_argument(
        "--artifact-dir",
        help="Override base artifact directory (defaults to ml_data/models/<symbol>/<model>).",
    )
    parser.add_argument(
        "--dataset-path",
        help="Optional direct path to features dataset (CSV/Parquet). Overrides cache lookup.",
    )
    parser.add_argument("--dataset-type", default="features", choices=["features"], help="Dataset type when using cache.")
    parser.add_argument("--mode", default="intraday", help="Mode label used during feature engineering.")
    parser.add_argument("--interval", default="60min", help="Interval tag used during feature engineering.")
    parser.add_argument("--outputsize", default="compact", help="Output size tag used during feature engineering.")
    parser.add_argument(
        "--features-version",
        default=DEFAULT_VERSION,
        help="Version of the feature dataset to load (default: latest).",
    )
    parser.add_argument("--target-column", default="target", help="Target column to drop if present.")
    parser.add_argument(
        "--predict-proba",
        action="store_true",
        help="For classifiers, also emit max predicted probability (predict_proba).",
    )
    parser.add_argument(
        "--upload",
        action="store_true",
        help="Upload predictions to Supabase (best effort).",
    )
    parser.add_argument("--upload-table", default="model_predictions", help="Supabase table for predictions.")
    parser.add_argument(
        "--head",
        action="store_true",
        help="Print head/tail of the prediction results.",
    )
    return parser.parse_args()


def load_dataset_from_path(path: str) -> pd.DataFrame:
    """Load a dataset directly from CSV/Parquet."""
    dataset_path = Path(path).expanduser().resolve()
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset path not found: {dataset_path}")

    if dataset_path.suffix.lower() == ".csv":
        df = pd.read_csv(dataset_path)
    elif dataset_path.suffix.lower() in {".parquet", ".pq"}:
        df = pd.read_parquet(dataset_path)
    else:
        raise ValueError(f"Unsupported dataset format: {dataset_path.suffix}")

    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df.set_index("timestamp", inplace=True)
    elif "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
        df.set_index("date", inplace=True)

    return df


def resolve_artifact_paths(
    symbol: str,
    model_name: str,
    artifact_path: Optional[str],
    metadata_path: Optional[str],
    artifact_dir: Optional[str],
) -> Tuple[Path, Path]:
    base_dir = Path(artifact_dir or MODEL_DIR / symbol / model_name).resolve()
    model_path = Path(artifact_path).expanduser().resolve() if artifact_path else base_dir / "latest.pkl"
    meta_path = Path(metadata_path).expanduser().resolve() if metadata_path else base_dir / "latest.json"
    if not model_path.exists():
        raise FileNotFoundError(f"Model artifact not found at {model_path}")
    if not meta_path.exists():
        raise FileNotFoundError(f"Metadata file not found at {meta_path}")
    return model_path, meta_path


def load_artifacts(
    symbol: str,
    model_name: str,
    artifact_path: Optional[str] = None,
    metadata_path: Optional[str] = None,
    artifact_dir: Optional[str] = None,
) -> Tuple[object, dict]:
    model_path, meta_path = resolve_artifact_paths(symbol, model_name, artifact_path, metadata_path, artifact_dir)
    with model_path.open("rb") as file:
        model = pickle.load(file)
    with meta_path.open("r", encoding="utf-8") as file:
        metadata = json.load(file)
    return model, metadata


def load_features(args: argparse.Namespace) -> pd.DataFrame:
    """Load feature dataset from cache or explicit path based on CLI args."""
    if args.dataset_path:
        logger.info("Loading dataset from %s", args.dataset_path)
        return load_dataset_from_path(args.dataset_path)

    df = load_dataset(
        dataset_type=args.dataset_type,
        symbol=args.symbol,
        mode=args.mode,
        interval=args.interval,
        outputsize=args.outputsize,
        version=args.features_version,
    )
    if df is None:
        raise FileNotFoundError(
            f"No cached dataset found for {args.symbol} "
            f"({args.dataset_type}, {args.mode}, {args.interval}, version={args.features_version})."
        )
    return df


def align_features(features_df: pd.DataFrame, metadata: dict, target_column: str) -> pd.DataFrame:
    """Align feature columns with the trained model metadata."""
    df = features_df.copy()
    if target_column in df.columns:
        df = df.drop(columns=[target_column])

    feature_columns = metadata.get("feature_columns")
    if feature_columns:
        missing = [col for col in feature_columns if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required feature columns: {missing}")
        df = df[feature_columns]

    return df


def run_predictions(model, feature_df: pd.DataFrame, want_proba: bool) -> Tuple[pd.Series, Optional[pd.Series]]:
    """Run model predictions (optionally probabilities for classifiers)."""
    preds = pd.Series(model.predict(feature_df), index=feature_df.index, name="prediction")
    proba_series: Optional[pd.Series] = None

    if want_proba and hasattr(model, "predict_proba"):
        try:
            proba = model.predict_proba(feature_df)
            # Use max class probability for multi-class; flatten for binary.
            if proba.ndim > 1:
                proba = proba.max(axis=1)
            proba_series = pd.Series(proba, index=feature_df.index, name="prediction_proba")
        except Exception as exc:  # pylint: disable=broad-except
            logger.warning("predict_proba failed, continuing without probabilities: %s", exc)

    return preds, proba_series


def build_results_df(
    feature_df: pd.DataFrame,
    predictions: pd.Series,
    proba: Optional[pd.Series],
    args: argparse.Namespace,
    metadata: dict,
) -> pd.DataFrame:
    """Construct a result DataFrame suitable for display or upload."""
    ts_series = pd.Series(feature_df.index, name="timestamp")
    try:
        ts_series = pd.to_datetime(ts_series)
    except Exception:
        pass  # keep as-is if not parseable

    result = pd.DataFrame(
        {
            "timestamp": ts_series.astype(str),
            "symbol": args.symbol,
            "model": args.model,
            "dataset_version": args.features_version,
            "prediction": predictions.values,
            "predicted_at": datetime.utcnow().isoformat(),
        },
        index=feature_df.index,
    )
    if proba is not None:
        result["prediction_proba"] = proba.values

    # Include target column if present in metadata for traceability
    if metadata.get("target_column"):
        result["target_column"] = metadata["target_column"]

    return result


def upload_predictions_to_supabase(results_df: pd.DataFrame, table_name: str) -> None:
    """Best-effort upload of prediction results to Supabase."""
    try:
        from .supabase_uploader import SupabaseUploadError, supabase
    except Exception as exc:  # pylint: disable=broad-except
        logger.warning("Supabase upload skipped (client unavailable): %s", exc)
        return

    records = results_df.reset_index(drop=True).to_dict(orient="records")
    try:
        for idx in range(0, len(records), 100):
            chunk = records[idx : idx + 100]
            response = supabase.table(table_name).upsert(chunk).execute()
            if getattr(response, "error", None):
                raise SupabaseUploadError(response.error.message)
        logger.info("✅ Uploaded %d prediction rows to %s", len(records), table_name)
    except Exception as exc:  # pylint: disable=broad-except
        logger.warning("Failed to upload predictions: %s", exc)


def main() -> None:
    args = parse_args()

    model, metadata = load_artifacts(
        args.symbol,
        args.model,
        artifact_path=args.artifact_path,
        metadata_path=args.metadata_path,
        artifact_dir=args.artifact_dir,
    )
    metadata_dict = metadata if isinstance(metadata, dict) else dict(metadata)

    features_df = load_features(args)
    aligned_features = align_features(features_df, metadata_dict, args.target_column)
    predictions, proba = run_predictions(model, aligned_features, args.predict_proba)
    results_df = build_results_df(aligned_features, predictions, proba, args, metadata_dict)

    logger.info("Generated %d predictions for %s", len(results_df), args.symbol)
    if args.head:
        print(results_df.head())
        print(results_df.tail())

    if args.upload:
        upload_predictions_to_supabase(results_df, args.upload_table)


if __name__ == "__main__":
    main()
