"""
Train machine learning models on engineered features.

Supports loading cached datasets, training multiple model types, performing
cross-validation, and saving both artifacts and metadata locally.
"""

from __future__ import annotations

import argparse
import json
import logging
import pickle
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

import numpy as np
import pandas as pd
import yaml
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import TimeSeriesSplit

from .config import DATA_STORAGE_DIR
from .dataset_manager import (
    DEFAULT_VERSION,
    ensure_data_dirs,
    load_dataset,
    split_dataset,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

MODEL_REGISTRY = {
    "linear_regression": {"task": "regression", "cls": LinearRegression},
    "random_forest": {"task": "regression", "cls": RandomForestRegressor},
    "logistic_regression": {"task": "classification", "cls": LogisticRegression},
    "random_forest_classifier": {"task": "classification", "cls": RandomForestClassifier},
}

MODEL_DIR = Path(DATA_STORAGE_DIR / "models").resolve()


def parse_args() -> argparse.Namespace:
    """Configure CLI parameters for the training entry point."""
    parser = argparse.ArgumentParser(description="Train ML models on cached features.")
    parser.add_argument("--symbol", required=True, help="Ticker symbol to train on.")
    parser.add_argument(
        "--dataset-path",
        help="Optional direct path to features dataset (CSV/Parquet). Overrides cache lookup.",
    )
    parser.add_argument(
        "--dataset-type",
        default="features",
        choices=["features"],
        help="Type of dataset to load when using cache (engineered features).",
    )
    parser.add_argument(
        "--mode",
        default="intraday",
        help="Mode used during feature engineering.",
    )
    parser.add_argument(
        "--interval",
        default="60min",
        help="Interval corresponding to the feature dataset.",
    )
    parser.add_argument(
        "--outputsize",
        default="compact",
        help="Output size tag from the feature dataset version.",
    )
    parser.add_argument(
        "--features-version",
        default=DEFAULT_VERSION,
        help="Version of the feature dataset to load (default: latest).",
    )
    parser.add_argument(
        "--target-column",
        default="target",
        help="Column name to predict. Must exist in the dataset.",
    )
    parser.add_argument(
        "--task",
        choices=["regression", "classification"],
        help="Explicit task type. Defaults to the model's task.",
    )
    parser.add_argument(
        "--model",
        default="random_forest",
        choices=list(MODEL_REGISTRY.keys()),
        help="Model type to train.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of data reserved for validation.",
    )
    parser.add_argument(
        "--n-splits",
        type=int,
        default=5,
        help="Number of TimeSeriesSplit folds for cross-validation.",
    )
    parser.add_argument(
        "--hyperparams",
        type=json.loads,
        default="{}",
        help='JSON string of model hyperparameters. Example: \'{"n_estimators": 300}\'',
    )
    parser.add_argument(
        "--artifact-dir",
        help="Optional directory to save model artifacts. Defaults under ml_data/models.",
    )
    parser.add_argument(
        "--export-onnx",
        action="store_true",
        help="Export an ONNX artifact (requires skl2onnx).",
    )
    parser.add_argument(
        "--upload-metadata",
        action="store_true",
        help="Upload model metadata/metrics to Supabase.",
    )
    parser.add_argument(
        "--metadata-table",
        default="model_metadata",
        help="Supabase table name for metadata uploads.",
    )
    parser.add_argument(
        "--metrics-log",
        help="Optional YAML log file to append training run metadata/metrics.",
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


def build_model(model_name: str, hyperparams: Dict[str, Any]):
    """Instantiate a model from the registry with provided hyperparameters."""
    entry = MODEL_REGISTRY.get(model_name)
    if not entry:
        raise ValueError(f"Unsupported model '{model_name}'.")
    model_cls = entry["cls"]
    return model_cls(**hyperparams)


def compute_metrics(task: str, y_true: pd.Series, y_pred: np.ndarray) -> Dict[str, float]:
    """Compute metrics for regression or classification tasks."""
    if task == "regression":
        return {
            "mae": mean_absolute_error(y_true, y_pred),
            "rmse": mean_squared_error(y_true, y_pred, squared=False),
            "r2": r2_score(y_true, y_pred),
        }

    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0, average="weighted"),
        "recall": recall_score(y_true, y_pred, zero_division=0, average="weighted"),
        "f1": f1_score(y_true, y_pred, zero_division=0, average="weighted"),
    }


def cross_validate(
    model_name: str,
    hyperparams: Dict[str, Any],
    features_df: pd.DataFrame,
    target_series: pd.Series,
    task: str,
    n_splits: int = 5,
) -> Dict[str, float]:
    """Perform time-series cross-validation and aggregate metrics."""
    splitter = TimeSeriesSplit(n_splits=n_splits)
    scores: Dict[str, list] = {}

    for train_idx, val_idx in splitter.split(features_df):
        train_features = features_df.iloc[train_idx]
        val_features = features_df.iloc[val_idx]
        train_target = target_series.iloc[train_idx]
        val_target = target_series.iloc[val_idx]

        model = build_model(model_name, hyperparams)
        model.fit(train_features, train_target)
        predictions = model.predict(val_features)
        metrics = compute_metrics(task, val_target, predictions)
        for key, value in metrics.items():
            scores.setdefault(key, []).append(value)

    return {
        f"{metric}_mean": float(np.mean(values))
        for metric, values in scores.items()
    } | {
        f"{metric}_std": float(np.std(values))
        for metric, values in scores.items()
    }


def _export_onnx_model(model, feature_dim: int, onnx_path: Path) -> Optional[Path]:
    """Export a scikit-learn model to ONNX if skl2onnx is available."""
    try:
        from skl2onnx import convert_sklearn  # pylint: disable=import-outside-toplevel
        from skl2onnx.common.data_types import FloatTensorType  # pylint: disable=import-outside-toplevel
    except ImportError:
        logger.warning("ONNX export skipped: install skl2onnx to enable.")
        return None

    try:
        onnx_model = convert_sklearn(
            model,
            initial_types=[("float_input", FloatTensorType([None, feature_dim]))],
        )
        with onnx_path.open("wb") as file:
            file.write(onnx_model.SerializeToString())
        return onnx_path
    except Exception as exc:  # pylint: disable=broad-except
        logger.warning("Failed to export ONNX model: %s", exc)
        return None


def save_artifacts(
    model,
    metadata: Dict[str, Any],
    artifact_dir: Optional[str] = None,
    export_onnx: bool = False,
    feature_dim: Optional[int] = None,
) -> Tuple[Path, Path, Optional[Path]]:
    """Persist model pickle + metadata JSON + optional ONNX export."""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    model_dir = Path(artifact_dir or MODEL_DIR / metadata["symbol"] / metadata["model"])
    model_dir.mkdir(parents=True, exist_ok=True)

    artifact_path = model_dir / f"{timestamp}.pkl"
    latest_path = model_dir / "latest.pkl"
    metadata_path = model_dir / f"{timestamp}.json"
    latest_metadata_path = model_dir / "latest.json"

    with artifact_path.open("wb") as file:
        pickle.dump(model, file)
    with latest_path.open("wb") as file:
        pickle.dump(model, file)
    with metadata_path.open("w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=2)
    with latest_metadata_path.open("w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=2)

    onnx_path = None
    if export_onnx and feature_dim:
        onnx_path = _export_onnx_model(model, feature_dim, model_dir / f"{timestamp}.onnx")

    return artifact_path, metadata_path, onnx_path


def log_metrics_yaml(record: Dict[str, Any], log_path: Path) -> None:
    """Append a training record to a YAML log file."""
    log_path = log_path.expanduser().resolve()
    log_path.parent.mkdir(parents=True, exist_ok=True)

    def _coerce_for_yaml(obj: Any) -> Any:
        """Convert numpy/scalar types to YAML-serializable primitives."""
        if isinstance(obj, dict):
            return {k: _coerce_for_yaml(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_coerce_for_yaml(v) for v in obj]
        if isinstance(obj, tuple):
            return tuple(_coerce_for_yaml(v) for v in obj)
        if isinstance(obj, np.generic):
            return obj.item()
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj

    clean_record = _coerce_for_yaml(record)

    existing: Any = []
    if log_path.exists():
        try:
            existing = yaml.safe_load(log_path.read_text(encoding="utf-8")) or []
        except (yaml.YAMLError, OSError) as exc:  # pragma: no cover - best effort
            logger.debug("Failed to read existing metrics log: %s", exc)
            existing = []

    if isinstance(existing, list):
        existing.append(clean_record)
        payload = existing
    else:
        payload = [existing, clean_record]

    payload = _coerce_for_yaml(payload)

    with log_path.open("w", encoding="utf-8") as file:
        yaml.safe_dump(payload, file)
    logger.info("Appended metrics to %s", log_path)


def maybe_upload_metadata_to_supabase(metadata: Dict[str, Any], table_name: str) -> None:
    """Best-effort upload of metadata to Supabase without failing training."""
    try:
        from .supabase_uploader import SupabaseUploadError, upload_model_metadata  # pylint: disable=import-outside-toplevel
    except ImportError as exc:
        logger.warning("Supabase upload skipped: %s", exc)
        return

    try:
        upload_model_metadata(metadata, table_name=table_name)
    except SupabaseUploadError as exc:
        logger.warning("Supabase upload failed: %s", exc)


def main() -> None:
    """Entry point for CLI training command."""
    ensure_data_dirs()
    args = parse_args()
    df = load_features(args)

    if args.target_column not in df.columns:
        raise ValueError(f"Target column '{args.target_column}' not found in dataset.")

    feature_df = df.drop(columns=[args.target_column])
    target_series = df[args.target_column]

    train_df, val_df = split_dataset(
        df[[*feature_df.columns, args.target_column]],
        test_size=args.test_size,
    )
    train_features = train_df.drop(columns=[args.target_column])
    train_target = train_df[args.target_column]
    val_features = val_df.drop(columns=[args.target_column])
    val_target = val_df[args.target_column]

    model_task = args.task or MODEL_REGISTRY[args.model]["task"]

    model = build_model(args.model, args.hyperparams)
    model.fit(train_features, train_target)
    predictions = model.predict(val_features)
    eval_metrics = compute_metrics(model_task, val_target, predictions)

    logger.info("Validation metrics: %s", eval_metrics)

    cv_metrics = cross_validate(
        args.model,
        args.hyperparams,
        feature_df,
        target_series,
        task=model_task,
        n_splits=args.n_splits,
    )
    logger.info("Cross-validation metrics: %s", cv_metrics)

    metadata = {
        "symbol": args.symbol,
        "dataset": {
            "source": "path" if args.dataset_path else "cache",
            "path": args.dataset_path,
            "type": args.dataset_type,
            "mode": args.mode,
            "interval": args.interval,
            "outputsize": args.outputsize,
            "version": args.features_version,
        },
        "model": args.model,
        "task": model_task,
        "hyperparameters": args.hyperparams,
        "metrics": {
            "validation": eval_metrics,
            "cross_validation": cv_metrics,
        },
        "timestamp": datetime.utcnow().isoformat(),
        "feature_columns": list(feature_df.columns),
        "target_column": args.target_column,
    }

    artifact_path, metadata_path, onnx_path = save_artifacts(
        model,
        metadata,
        args.artifact_dir,
        export_onnx=args.export_onnx,
        feature_dim=feature_df.shape[1],
    )

    run_record = {
        **metadata,
        "artifacts": {
            "pickle": str(artifact_path),
            "metadata": str(metadata_path),
            "onnx": str(onnx_path) if onnx_path else None,
        },
    }

    logger.info("Saved model artifact to %s", artifact_path)
    logger.info("Saved metadata to %s", metadata_path)
    if onnx_path:
        logger.info("Saved ONNX artifact to %s", onnx_path)

    if args.metrics_log:
        log_metrics_yaml(run_record, Path(args.metrics_log))

    if args.upload_metadata:
        maybe_upload_metadata_to_supabase(run_record, args.metadata_table)


if __name__ == "__main__":
    main()
