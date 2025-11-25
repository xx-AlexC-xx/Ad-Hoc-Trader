"""
Utilities for managing local dataset storage and caching.

Provides helpers for saving/loading raw and feature datasets in a consistent
directory structure, as well as simple splitting/versioning utilities.
"""

from __future__ import annotations

import logging
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import List, Optional, Tuple

import pandas as pd

from .config import (
    FEATURES_DATA_DIR,
    RAW_DATA_DIR,
    S3_BUCKET,
    S3_PREFIX,
    S3_REGION,
    S3_ENDPOINT,
    USE_S3,
)

try:
    import boto3  # type: ignore[import-not-found]
except ImportError:  # pragma: no cover - optional dependency
    boto3 = None

logger = logging.getLogger(__name__)

DATASET_DIRS = {
    "raw": RAW_DATA_DIR,
    "features": FEATURES_DATA_DIR,
}

DEFAULT_VERSION = "latest"
TIMESTAMP_FMT = "%Y%m%d%H%M%S"


def ensure_data_dirs() -> None:
    """Create dataset directories if they do not exist."""
    for path in DATASET_DIRS.values():
        path.mkdir(parents=True, exist_ok=True)


def _sanitize_part(part: Optional[str]) -> Optional[str]:
    if not part:
        return None
    return part.replace(" ", "").replace("/", "-").lower()


def _dataset_dir(
    dataset_type: str,
    symbol: str,
    mode: str = "default",
    interval: Optional[str] = None,
    outputsize: Optional[str] = None,
) -> Path:
    if dataset_type not in DATASET_DIRS:
        raise ValueError(f"Unsupported dataset type '{dataset_type}'.")

    path = DATASET_DIRS[dataset_type] / symbol.upper() / _sanitize_part(mode or "default")
    interval_part = _sanitize_part(interval)
    output_part = _sanitize_part(outputsize)

    if interval_part:
        path /= interval_part
    if output_part:
        path /= output_part

    return path


def _dataset_key(
    dataset_type: str,
    symbol: str,
    mode: str = "default",
    interval: Optional[str] = None,
    outputsize: Optional[str] = None,
    version: str = DEFAULT_VERSION,
) -> str:
    """
    Build the S3 object key matching the local dataset layout.
    """
    parts = [
        _sanitize_part(S3_PREFIX),
        dataset_type,
        symbol.upper(),
        _sanitize_part(mode or "default"),
    ]
    interval_part = _sanitize_part(interval)
    output_part = _sanitize_part(outputsize)
    if interval_part:
        parts.append(interval_part)
    if output_part:
        parts.append(output_part)

    return "/".join(filter(None, parts)) + f"/{version}.parquet"


def get_dataset_path(
    dataset_type: str,
    symbol: str,
    mode: str = "default",
    interval: Optional[str] = None,
    outputsize: Optional[str] = None,
    version: str = DEFAULT_VERSION,
    create_dirs: bool = False,
) -> Path:
    """
    Compute the file path for the requested dataset parameters.
    """
    base_dir = _dataset_dir(dataset_type, symbol, mode, interval, outputsize)
    if create_dirs:
        base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir / f"{version}.parquet"


def _get_s3_client():
    if not USE_S3:
        raise RuntimeError("S3 is not configured. Set ML_S3_BUCKET to enable.")
    if boto3 is None:
        raise ImportError(
            "boto3 is required for S3 dataset operations. Install boto3 to continue."
        )
    return boto3.client(
        "s3",
        region_name=S3_REGION or None,
        endpoint_url=S3_ENDPOINT or None,
    )


def _download_dataset_from_s3(
    dataset_type: str,
    symbol: str,
    mode: str,
    interval: Optional[str],
    outputsize: Optional[str],
    version: str,
    local_path: Path,
) -> Optional[pd.DataFrame]:
    if not USE_S3:
        return None

    client = _get_s3_client()
    key = _dataset_key(dataset_type, symbol, mode, interval, outputsize, version)
    try:
        obj = client.get_object(Bucket=S3_BUCKET, Key=key)
    except Exception as exc:  # pragma: no cover - passthrough logging
        logger.debug("S3 get_object failed for %s/%s: %s", S3_BUCKET, key, exc)
        return None

    df = pd.read_parquet(BytesIO(obj["Body"].read()))
    try:
        local_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(local_path)
    except Exception as exc:  # pragma: no cover
        logger.warning("Failed to persist S3 dataset locally at %s: %s", local_path, exc)
    logger.info("Loaded dataset from s3://%s/%s", S3_BUCKET, key)
    return df


def _upload_dataset_to_s3(local_path: Path, key: str) -> None:
    if not USE_S3:
        return
    client = _get_s3_client()
    try:
        client.upload_file(str(local_path), S3_BUCKET, key)
        logger.info("Uploaded dataset to s3://%s/%s", S3_BUCKET, key)
    except Exception as exc:  # pragma: no cover
        logger.warning("Failed to upload %s to s3://%s/%s: %s", local_path, S3_BUCKET, key, exc)


def list_versions(
    dataset_type: str,
    symbol: str,
    mode: str = "default",
    interval: Optional[str] = None,
    outputsize: Optional[str] = None,
    include_latest: bool = False,
) -> List[str]:
    """List available cached versions for the dataset."""
    base_dir = _dataset_dir(dataset_type, symbol, mode, interval, outputsize)
    if not base_dir.exists():
        return []

    versions = []
    for path in sorted(base_dir.glob("*.parquet")):
        version = path.stem
        if not include_latest and version == DEFAULT_VERSION:
            continue
        versions.append(version)
    return versions


def dataset_exists(
    dataset_type: str,
    symbol: str,
    mode: str = "default",
    interval: Optional[str] = None,
    outputsize: Optional[str] = None,
    version: str = DEFAULT_VERSION,
) -> bool:
    """Return True if a cached dataset exists for the given parameters."""
    path = get_dataset_path(
        dataset_type,
        symbol,
        mode,
        interval,
        outputsize,
        version,
        create_dirs=False,
    )
    if path.exists():
        return True

    if USE_S3:
        try:
            client = _get_s3_client()
            client.head_object(
                Bucket=S3_BUCKET,
                Key=_dataset_key(dataset_type, symbol, mode, interval, outputsize, version),
            )
            return True
        except Exception:  # pragma: no cover - best effort
            return False

    return False


def load_dataset(
    dataset_type: str,
    symbol: str,
    mode: str = "default",
    interval: Optional[str] = None,
    outputsize: Optional[str] = None,
    version: str = DEFAULT_VERSION,
) -> Optional[pd.DataFrame]:
    """
    Load a cached dataset if available. Returns None when not found.
    """
    path = get_dataset_path(
        dataset_type,
        symbol,
        mode,
        interval,
        outputsize,
        version,
        create_dirs=False,
    )
    if path.exists():
        return pd.read_parquet(path)

    s3_df = _download_dataset_from_s3(
        dataset_type=dataset_type,
        symbol=symbol,
        mode=mode,
        interval=interval,
        outputsize=outputsize,
        version=version,
        local_path=path,
    )
    if s3_df is not None:
        return s3_df

    if version == DEFAULT_VERSION:
        versions = list_versions(
            dataset_type,
            symbol,
            mode,
            interval,
            outputsize,
        )
        if versions:
            return load_dataset(
                dataset_type,
                symbol,
                mode,
                interval,
                outputsize,
                version=versions[-1],
            )
    return None


def save_dataset(
    df: pd.DataFrame,
    dataset_type: str,
    symbol: str,
    mode: str = "default",
    interval: Optional[str] = None,
    outputsize: Optional[str] = None,
    version: Optional[str] = None,
    persist_latest: bool = True,
) -> Path:
    """
    Save a dataset to disk. Returns the path of the versioned file.
    """
    ensure_data_dirs()
    version_name = version or datetime.utcnow().strftime(TIMESTAMP_FMT)
    version_path = get_dataset_path(
        dataset_type,
        symbol,
        mode,
        interval,
        outputsize,
        version_name,
        create_dirs=True,
    )
    df.to_parquet(version_path)
    _upload_dataset_to_s3(
        version_path,
        _dataset_key(dataset_type, symbol, mode, interval, outputsize, version_name),
    )

    if persist_latest and version_name != DEFAULT_VERSION:
        latest_path = get_dataset_path(
            dataset_type,
            symbol,
            mode,
            interval,
            outputsize,
            DEFAULT_VERSION,
            create_dirs=True,
        )
        df.to_parquet(latest_path)
        _upload_dataset_to_s3(
            latest_path,
            _dataset_key(dataset_type, symbol, mode, interval, outputsize, DEFAULT_VERSION),
        )

    return version_path


def split_dataset(
    df: pd.DataFrame,
    test_size: float = 0.2,
    shuffle: bool = False,
    random_state: Optional[int] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split a DataFrame into train/test partitions.
    """
    if not 0 < test_size < 1:
        raise ValueError("test_size must be between 0 and 1.")

    if shuffle:
        df = df.sample(frac=1, random_state=random_state)

    split_idx = int(len(df) * (1 - test_size))
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()
    return train_df, test_df
