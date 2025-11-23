from __future__ import annotations

"""Training pipeline for the ABA Forecast stress-level classifier."""

from dataclasses import dataclass
from pathlib import Path
import argparse
import json
from typing import Iterable

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

DATA_FILE_DEFAULT = Path("backend") / "data" / "synthetic_behavior_data.csv"
MODEL_DIR_DEFAULT = Path("backend") / "models"
MODEL_FILENAME = "behavior_predictor.joblib"
METRICS_FILENAME = "behavior_predictor_metrics.json"


@dataclass(frozen=True)
class TrainConfig:
    data_path: Path
    model_dir: Path
    test_size: float
    random_seed: int


CATEGORICAL_FEATURES = [
]

NUMERIC_FEATURES = [
    "sleep_quality_numeric",
    "time_numeric",
    "weekday_numeric",
    "temperature_c",
    "humidity_percent",
    "weather_type_numeric",
    "time_since_last_meal_min",
    "time_since_last_void_min",
    "recent_accident_flag",
    "toileting_status_bucket_numeric",
    "transition_type_numeric",
    "social_context_numeric",
]

DROP_COLUMNS = [
    "behaviour_topography",
    "antecedent_category_numeric",
    "function_inferred_numeric",
    "behaviour_level",
]
TARGET_COLUMN = "escalation_label"
TOP_FEATURE_LIMIT = 10


def parse_args() -> TrainConfig:
    parser = argparse.ArgumentParser(description="Train behavior stress-level classifier")
    parser.add_argument(
        "--data-path",
        type=Path,
        default=DATA_FILE_DEFAULT,
        help="Path to the CSV dataset",
    )
    parser.add_argument(
        "--model-dir",
        type=Path,
        default=MODEL_DIR_DEFAULT,
        help="Directory where the trained model and metrics will be stored",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of data to reserve for validation",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility",
    )

    args = parser.parse_args()
    return TrainConfig(
        data_path=args.data_path,
        model_dir=args.model_dir,
        test_size=args.test_size,
        random_seed=args.seed,
    )


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {path}. Generate it first using generate_synthetic_data.py"
        )
    return pd.read_csv(path)


def build_pipeline(random_seed: int) -> Pipeline:
    preprocess = ColumnTransformer(
        transformers=[
            (
                "numeric",
                StandardScaler(),
                NUMERIC_FEATURES,
            )
        ],
        remainder="drop",
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
        n_jobs=-1,
        random_state=random_seed,
    )

    return Pipeline(
        steps=[
            ("preprocess", preprocess),
            ("clf", model),
        ]
    )


def aggregate_feature_importance(
    pipeline: Pipeline,
) -> list[dict[str, float]]:
    model = pipeline.named_steps["clf"]
    preprocessor: ColumnTransformer = pipeline.named_steps["preprocess"]

    importances = model.feature_importances_
    aggregated: dict[str, float] = {}
    cursor = 0

    for name, transformer, columns in preprocessor.transformers_:
        if name == "remainder":
            continue

        for column in columns:
            aggregated[column] = aggregated.get(column, 0.0) + float(importances[cursor])
            cursor += 1

    total = sum(aggregated.values()) or 1.0
    ranked = sorted(aggregated.items(), key=lambda item: item[1], reverse=True)
    return [
        {
            "feature": feature,
            "importance": round(value, 4),
            "relative_importance": round(value / total, 4),
        }
        for feature, value in ranked[:TOP_FEATURE_LIMIT]
    ]


def optimize_threshold(y_true: pd.Series, y_proba: np.ndarray) -> tuple[float, float]:
    thresholds = np.linspace(0.1, 0.9, 81)
    best_threshold = 0.5
    best_macro_f1 = -1.0

    for threshold in thresholds:
        y_pred = (y_proba >= threshold).astype(int)
        macro = f1_score(y_true, y_pred, average="macro")
        if macro > best_macro_f1:
            best_macro_f1 = macro
            best_threshold = float(threshold)

    return best_threshold, best_macro_f1


def train(config: TrainConfig) -> dict[str, float | str]:
    df = load_dataset(config.data_path)
    df = df.drop(columns=[col for col in DROP_COLUMNS if col in df.columns])

    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' missing from dataset")

    X = df.drop(columns=[TARGET_COLUMN])
    y = df[TARGET_COLUMN]

    X_train, X_val, y_train, y_val = train_test_split(
        X,
        y,
        test_size=config.test_size,
        random_state=config.random_seed,
        stratify=y,
    )

    pipeline = build_pipeline(config.random_seed)
    pipeline.fit(X_train, y_train)

    y_proba = pipeline.predict_proba(X_val)[:, 1]
    best_threshold, best_macro_f1 = optimize_threshold(y_val, y_proba)
    y_pred = (y_proba >= best_threshold).astype(int)

    accuracy = accuracy_score(y_val, y_pred)
    macro_f1 = best_macro_f1
    report = classification_report(y_val, y_pred, output_dict=True)

    config.model_dir.mkdir(parents=True, exist_ok=True)

    model_path = config.model_dir / MODEL_FILENAME
    joblib.dump(pipeline, model_path)

    feature_importance = aggregate_feature_importance(pipeline)

    metrics = {
        "accuracy": round(float(accuracy), 4),
        "macro_f1": round(float(macro_f1), 4),
        "class_distribution": dict(pd.Series(y).value_counts(normalize=True).round(4)),
        "classification_report": report,
        "model_path": str(model_path.resolve()),
        "train_samples": int(len(X_train)),
        "val_samples": int(len(X_val)),
        "top_feature_importance": feature_importance,
        "decision_threshold": round(best_threshold, 3),
    }

    metrics_path = config.model_dir / METRICS_FILENAME
    with metrics_path.open("w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    return metrics


def main() -> None:
    config = parse_args()
    metrics = train(config)
    print("Model training complete. Metrics:")
    print(
        f"  Accuracy: {metrics['accuracy'] * 100:.1f}%\n"
        f"  Macro F1: {metrics['macro_f1'] * 100:.1f}%\n"
        f"  Decision threshold: {metrics['decision_threshold']:.2f}"
    )
    class_dist = metrics["class_distribution"]
    print(
        "  Class distribution:" +
        "  ".join(
            f" label {label}: {percent * 100:.1f}%" for label, percent in class_dist.items()
        )
    )
    print("  Top feature importance:")
    for idx, feat in enumerate(metrics["top_feature_importance"], start=1):
        print(
            f"    {idx}. {feat['feature']:<30} {feat['importance'] * 100:.1f}%"  # absolute weight
        )
    print(json.dumps({k: v for k, v in metrics.items() if k != "classification_report"}, indent=2))


if __name__ == "__main__":
    main()
