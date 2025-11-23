from __future__ import annotations

"""Utility for generating ABA-informed synthetic data for ABAi."""

from dataclasses import dataclass
from pathlib import Path
import argparse
from typing import Iterable

import numpy as np
import pandas as pd


WEATHER_PROFILES = {
    0: {"temp": (16, 26), "humidity": (40, 65)},  # clear/calm
    1: {"temp": (18, 28), "humidity": (55, 80)},  # cloudy/overcast
    2: {"temp": (20, 30), "humidity": (60, 90)},  # rain/drizzle
    3: {"temp": (22, 34), "humidity": (70, 100)},  # storm/thunderstorm
}

TRANSITION_CHOICES = np.array([0, 1, 2, 3])
TRANSITION_PROBS = np.array([0.35, 0.35, 0.2, 0.1])

SOCIAL_CONTEXT_CHOICES = np.array([0, 1, 2, 3])
SOCIAL_CONTEXT_PROBS = np.array([0.3, 0.25, 0.3, 0.15])

ANTECEDENT_CHOICES = np.array([0, 1, 2, 3])
ANTECEDENT_PROBS = np.array([0.25, 0.25, 0.25, 0.25])

FUNCTION_CHOICES = np.array([0, 1, 2, 3])
FUNCTION_PROBS = np.array([0.2, 0.3, 0.25, 0.25])

TOPOGRAPHY_BY_FUNCTION = {
    0: ("self_injury", "head_banging"),
    1: ("screaming", "throwing_objects"),
    2: ("elopement", "throwing_objects"),
    3: ("biting", "property_destruction"),
}


@dataclass(frozen=True)
class BehaviorSample:
    sleep_quality_numeric: int
    time_numeric: int
    weekday_numeric: int
    temperature_c: int
    humidity_percent: int
    weather_type_numeric: int
    time_since_last_meal_min: int
    time_since_last_void_min: int
    recent_accident_flag: int
    toileting_status_bucket_numeric: int
    transition_type_numeric: int
    social_context_numeric: int
    antecedent_category_numeric: int
    function_inferred_numeric: int
    behaviour_level: int
    escalation_label: int
    behaviour_topography: str


def _clip01(value: float) -> float:
    return float(np.clip(value, 0.0, 1.0))


def _sample_weather(rng: np.random.Generator) -> tuple[int, int, int]:
    weather_type = int(rng.choice([0, 1, 2, 3], p=[0.4, 0.3, 0.2, 0.1]))
    temp_low, temp_high = WEATHER_PROFILES[weather_type]["temp"]
    hum_low, hum_high = WEATHER_PROFILES[weather_type]["humidity"]
    temperature_c = int(rng.integers(temp_low, temp_high + 1))
    humidity_percent = int(rng.integers(hum_low, hum_high + 1))
    return weather_type, temperature_c, humidity_percent


def _determine_behaviour_level(risk: float) -> int:
    if risk >= 0.75:
        return 3
    if risk >= 0.55:
        return 2
    if risk >= 0.35:
        return 1
    return 0


def _choose_topography(rng: np.random.Generator, function_code: int) -> str:
    options = TOPOGRAPHY_BY_FUNCTION.get(function_code, ("screaming",))
    return str(rng.choice(options))


VARIABILITY_MAP = {
    "tight": 0.7,
    "baseline": 1.0,
    "wide": 1.35,
}


def generate_samples(
    num_samples: int,
    seed: int | None = None,
    variability: str = "baseline",
) -> list[BehaviorSample]:
    rng = np.random.default_rng(seed)
    samples: list[BehaviorSample] = []
    spread = VARIABILITY_MAP.get(variability, VARIABILITY_MAP["baseline"])

    for _ in range(num_samples):
        sleep_quality_numeric = int(rng.choice([0, 1, 2], p=[0.2, 0.45, 0.35]))
        time_numeric = int(rng.integers(360, 1440))  # focus on awake hours
        weekday_numeric = int(rng.choice([0, 1, 2, 3, 4, 5, 6], p=[0.17, 0.17, 0.17, 0.16, 0.16, 0.09, 0.08]))

        weather_type_numeric, temperature_c, humidity_percent = _sample_weather(rng)

        time_since_last_meal_min = int(
            np.clip(rng.normal(loc=150, scale=65 * spread), 15, 360)
        )
        time_since_last_void_min = int(
            np.clip(rng.normal(loc=80, scale=40 * spread), 10, 210)
        )

        recent_accident_flag = 0
        if time_since_last_void_min > 120 and rng.random() < 0.45:
            recent_accident_flag = 1
        elif rng.random() < 0.08:
            recent_accident_flag = 1

        toileting_status_bucket_numeric = int(
            np.clip(rng.normal(loc=1.2, scale=0.9 * spread), 0, 3)
        )
        transition_type_numeric = int(rng.choice(TRANSITION_CHOICES, p=TRANSITION_PROBS))
        social_context_numeric = int(rng.choice(SOCIAL_CONTEXT_CHOICES, p=SOCIAL_CONTEXT_PROBS))
        antecedent_category_numeric = int(rng.choice(ANTECEDENT_CHOICES, p=ANTECEDENT_PROBS))
        function_inferred_numeric = int(rng.choice(FUNCTION_CHOICES, p=FUNCTION_PROBS))

        # Risk modelling inspired by ABA heuristics
        risk = 0.1
        risk += {0: 0.38, 1: 0.22, 2: 0.12}[sleep_quality_numeric]
        risk += min(time_since_last_meal_min / 280, 1.0) * 0.16
        risk += min(time_since_last_void_min / 180, 1.0) * 0.14
        risk += 0.28 if recent_accident_flag else 0.0
        risk += toileting_status_bucket_numeric * 0.06
        risk += transition_type_numeric * 0.07
        risk += social_context_numeric * 0.045
        risk += antecedent_category_numeric * 0.06
        risk += function_inferred_numeric * 0.06
        risk += max(0.0, (temperature_c - 24) / 10) * 0.08
        risk += max(0.0, (humidity_percent - 65) / 30) * 0.07
        risk += {0: 0.0, 1: 0.02, 2: 0.05, 3: 0.1}[weather_type_numeric]

        if weekday_numeric >= 5:  # weekend staffing/novelty
            risk += 0.04
        else:
            risk += 0.02

        if 720 <= time_numeric <= 1020:
            risk += 0.05
        elif time_numeric >= 1080:
            risk += 0.07
        elif time_numeric <= 540:
            risk += 0.03

        noise = rng.normal(loc=0.0, scale=0.05)
        risk = _clip01(risk + noise)

        behaviour_level = _determine_behaviour_level(risk)

        escalation_probability = risk * 0.85
        if recent_accident_flag:
            escalation_probability += 0.12
        if transition_type_numeric == 3:
            escalation_probability += 0.1
        if behaviour_level >= 3:
            escalation_probability += 0.08

        escalation_probability = _clip01(escalation_probability)
        escalation_label = int(rng.random() < escalation_probability)

        if escalation_label and behaviour_level < 2:
            behaviour_level = 2

        behaviour_topography = (
            _choose_topography(rng, function_inferred_numeric) if escalation_label else ""
        )

        samples.append(
            BehaviorSample(
                sleep_quality_numeric=sleep_quality_numeric,
                time_numeric=time_numeric,
                weekday_numeric=weekday_numeric,
                temperature_c=temperature_c,
                humidity_percent=humidity_percent,
                weather_type_numeric=weather_type_numeric,
                time_since_last_meal_min=time_since_last_meal_min,
                time_since_last_void_min=time_since_last_void_min,
                recent_accident_flag=recent_accident_flag,
                toileting_status_bucket_numeric=toileting_status_bucket_numeric,
                transition_type_numeric=transition_type_numeric,
                social_context_numeric=social_context_numeric,
                antecedent_category_numeric=antecedent_category_numeric,
                function_inferred_numeric=function_inferred_numeric,
                behaviour_level=behaviour_level,
                escalation_label=escalation_label,
                behaviour_topography=behaviour_topography,
            )
        )

    return samples


def samples_to_frame(samples: Iterable[BehaviorSample]) -> pd.DataFrame:
    return pd.DataFrame([sample.__dict__ for sample in samples])


def save_dataset(df: pd.DataFrame, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "synthetic_behavior_data.csv"
    df.to_csv(path, index=False)
    return path


def summarize_dataset(df: pd.DataFrame) -> dict[str, float]:
    return {
        "samples": int(len(df)),
        "accident_rate": round(float(df["recent_accident_flag"].mean()), 3),
        "sleep_quality_mean": round(float(df["sleep_quality_numeric"].mean()), 3),
        "sleep_quality_std": round(float(df["sleep_quality_numeric"].std()), 3),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate synthetic data for behavior prediction")
    parser.add_argument("--samples", type=int, default=7000, help="Number of samples to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument(
        "--variability",
        choices=VARIABILITY_MAP.keys(),
        default="baseline",
        help="Controls how wide the behaviour distributions are",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("backend") / "data",
        help="Directory where the dataset will be stored",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    samples = generate_samples(args.samples, seed=args.seed, variability=args.variability)
    df = samples_to_frame(samples)
    csv_path = save_dataset(df, args.output_dir)
    summary = summarize_dataset(df)
    print(f"Generated {len(df)} synthetic samples -> {csv_path}")
    print(
        "Dataset summary: "
        f"samples={summary['samples']}, accident_rate={summary['accident_rate']*100:.1f}%, "
        f"sleep_quality_mean={summary['sleep_quality_mean']}, "
        f"sleep_quality_std={summary['sleep_quality_std']}"
    )


if __name__ == "__main__":
    main()
