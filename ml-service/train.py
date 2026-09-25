"""
3rd Vision ML Service — Training Pipeline
========================================
Generates a synthetic correlated dataset, trains a RandomForestClassifier,
evaluates per-class metrics, and saves the model artifact.

Usage:
    python train.py

Output:
    - dataset.csv          (generated synthetic training data)
    - model.joblib         (trained sklearn model)
    - feature_config.json  (feature names/order + model metadata)

IMPORTANT:
    Labels are SYNTHETIC / PROTOTYPE labels generated from safety scenario rules.
    This model is NOT trained on real NMDC mine incident data.
    Do not claim validated collision prediction accuracy.
    Metrics reported below reflect performance on synthetic test data only.
"""

import json
import math
import random
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split

from preprocess import (
    FEATURE_NAMES,
    MODEL_VERSION,
    RISK_LABELS,
    compute_accel_magnitude,
    compute_gyro_magnitude,
    compute_tilt_magnitude,
)

# ─── Reproducibility ─────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)


# ═══════════════════════════════════════════════════════════════════════════════
# 1. SYNTHETIC DATASET GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_safe_samples(n=2000):
    """Normal operations — safe distance, stable IMU, good weather."""
    rows = []
    for _ in range(n):
        dist = random.uniform(20.0, 80.0)
        approach = random.uniform(-1.0, 1.5)
        pitch = random.gauss(0.0, 2.5)
        roll = random.gauss(0.0, 2.0)
        ax = random.gauss(0.0, 0.3)
        ay = random.gauss(0.0, 0.3)
        az = random.gauss(9.8, 0.2)
        gx = random.gauss(0.0, 0.1)
        gy = random.gauss(0.0, 0.1)
        gz = random.gauss(0.0, 0.1)
        vis = random.uniform(15.0, 25.0)
        hum = random.uniform(30.0, 65.0)

        rows.append(_make_row(dist, approach, pitch, roll, ax, ay, az,
                              gx, gy, gz, vis, hum, label=0))
    return rows


def generate_warning_samples(n=1500):
    """Moderate risk — approaching obstacle, moderate fog, some tilt."""
    rows = []
    for _ in range(n):
        dist = random.uniform(10.0, 28.0)
        approach = random.uniform(0.5, 4.0)
        pitch = random.gauss(0.0, 5.0)
        roll = random.gauss(0.0, 4.0)
        ax = random.gauss(0.0, 0.6)
        ay = random.gauss(0.0, 0.5)
        az = random.gauss(9.8, 0.4)
        gx = random.gauss(0.0, 0.3)
        gy = random.gauss(0.0, 0.3)
        gz = random.gauss(0.0, 0.2)
        vis = random.uniform(6.0, 18.0)
        hum = random.uniform(55.0, 82.0)

        rows.append(_make_row(dist, approach, pitch, roll, ax, ay, az,
                              gx, gy, gz, vis, hum, label=1))
    return rows


def generate_high_risk_samples(n=1200):
    """High risk — closing distance, low visibility, significant motion.

    Temporal/correlated relationships modelled:
      - approach_rate_mps is positively correlated with distance decrease
      - visibility_m and humidity_percent are inversely correlated (fog)
    """
    rows = []
    for _ in range(n):
        dist = random.uniform(4.0, 16.0)
        # Higher approach rate correlated with closer distance
        approach = random.uniform(2.0, 8.0) * (1.0 + (15.0 - dist) / 15.0)
        pitch = random.gauss(0.0, 8.0)
        roll = random.gauss(0.0, 6.0)
        ax = random.gauss(0.0, 1.0)
        ay = random.gauss(0.0, 0.8)
        az = random.gauss(9.8, 0.6)
        gx = random.gauss(0.0, 0.6)
        gy = random.gauss(0.0, 0.5)
        gz = random.gauss(0.0, 0.4)
        vis = random.uniform(3.0, 10.0)
        hum = random.uniform(72.0, 92.0)

        rows.append(_make_row(dist, approach, pitch, roll, ax, ay, az,
                              gx, gy, gz, vis, hum, label=2))
    return rows


def generate_critical_samples(n=800):
    """Critical — imminent hazard, very close, rapid closing, dense fog.

    Temporal/correlated relationships modelled:
      - distance very low (0.5–8 m)
      - approach rate strongly increases as distance decreases
      - visibility very low, humidity very high (dense fog scenario)
    """
    rows = []
    for _ in range(n):
        dist = random.uniform(0.5, 8.0)
        # Approach rate strongly correlated with distance
        approach = random.uniform(4.0, 12.0) * (1.0 + (8.0 - dist) / 8.0)
        pitch = random.gauss(0.0, 6.0)
        roll = random.gauss(0.0, 5.0)
        ax = random.gauss(0.0, 1.5)
        ay = random.gauss(0.0, 1.2)
        az = random.gauss(9.8, 0.8)
        gx = random.gauss(0.0, 1.0)
        gy = random.gauss(0.0, 0.8)
        gz = random.gauss(0.0, 0.6)
        vis = random.uniform(1.0, 6.0)
        hum = random.uniform(82.0, 98.0)

        rows.append(_make_row(dist, approach, pitch, roll, ax, ay, az,
                              gx, gy, gz, vis, hum, label=3))
    return rows


def generate_high_tilt_samples(n=300):
    """Slope/tilt hazard — extreme pitch/roll regardless of distance.

    Temporal/correlated relationships modelled:
      - pitch and roll are extreme (15–30°, 10–22° respectively)
      - tilt_magnitude > 25 → CRITICAL; otherwise HIGH_RISK
    """
    rows = []
    for _ in range(n):
        dist = random.uniform(8.0, 40.0)
        approach = random.uniform(0.0, 3.0)
        # The defining characteristic: extreme tilt
        pitch = random.choice([-1, 1]) * random.uniform(15.0, 30.0)
        roll = random.choice([-1, 1]) * random.uniform(10.0, 22.0)
        ax = random.gauss(0.0, 1.8)
        ay = random.gauss(0.0, 1.5)
        az = random.gauss(9.8, 1.0)
        gx = random.gauss(0.0, 0.8)
        gy = random.gauss(0.0, 0.7)
        gz = random.gauss(0.0, 0.5)
        vis = random.uniform(4.0, 15.0)
        hum = random.uniform(50.0, 85.0)

        # High tilt → HIGH_RISK or CRITICAL depending on magnitude
        tilt_mag = math.sqrt(pitch**2 + roll**2)
        label = 3 if tilt_mag > 25.0 else 2

        rows.append(_make_row(dist, approach, pitch, roll, ax, ay, az,
                              gx, gy, gz, vis, hum, label=label))
    return rows


def generate_sensor_noise_samples(n=200):
    """Sensor degradation — erratic IMU readings, fog conditions.

    Temporal/correlated relationships modelled:
      - All sensors have elevated variance (measurement noise)
      - Fog + high humidity accompanies sensor noise scenario
      - Noisy sensor → at least WARNING, often HIGH_RISK
    """
    rows = []
    for _ in range(n):
        dist = random.uniform(2.0, 30.0) + random.gauss(0, 5.0)  # noisy
        dist = max(0.5, dist)
        approach = random.uniform(-2.0, 8.0)
        pitch = random.gauss(0.0, 12.0)  # unstable
        roll = random.gauss(0.0, 10.0)
        ax = random.gauss(0.0, 2.5)  # high noise
        ay = random.gauss(0.0, 2.0)
        az = random.gauss(9.8, 1.5)
        gx = random.gauss(0.0, 1.5)
        gy = random.gauss(0.0, 1.2)
        gz = random.gauss(0.0, 1.0)
        vis = random.uniform(2.0, 8.0)
        hum = random.uniform(75.0, 95.0)

        # Noisy sensor → at least WARNING, often HIGH_RISK
        label = 2 if abs(pitch) > 10 or dist < 8 else 1

        rows.append(_make_row(dist, approach, pitch, roll, ax, ay, az,
                              gx, gy, gz, vis, hum, label=label))
    return rows


def _make_row(dist, approach, pitch, roll, ax, ay, az, gx, gy, gz,
              vis, hum, label):
    """Create a single 9-feature row with derived IMU magnitudes.

    Note: speed_kmh is intentionally excluded from rf-v1.
    The physical prototype (ESP32 + HC-SR04 + MPU6500) has no speed sensor.
    Future rf-v2 models may add speed, GPS, and other optional telemetry.
    """
    accel_mag = compute_accel_magnitude(ax, ay, az)
    gyro_mag = compute_gyro_magnitude(gx, gy, gz)
    tilt_mag = compute_tilt_magnitude(pitch, roll)

    return {
        "distance_m": round(dist, 2),
        "approach_rate_mps": round(approach, 2),
        "pitch": round(pitch, 2),
        "roll": round(roll, 2),
        "accel_magnitude": round(accel_mag, 4),
        "gyro_magnitude": round(gyro_mag, 4),
        "tilt_magnitude": round(tilt_mag, 4),
        "visibility_m": round(vis, 1),
        "humidity_percent": round(hum, 1),
        "label": label,
    }


def generate_dataset():
    """Generate the full synthetic dataset from all scenario generators."""
    print("=" * 60)
    print("  3rd Vision ML -- Synthetic Dataset Generation")
    print("=" * 60)

    all_rows = []
    all_rows.extend(generate_safe_samples(2000))
    all_rows.extend(generate_warning_samples(1500))
    all_rows.extend(generate_high_risk_samples(1200))
    all_rows.extend(generate_critical_samples(800))
    all_rows.extend(generate_high_tilt_samples(300))
    all_rows.extend(generate_sensor_noise_samples(200))

    df = pd.DataFrame(all_rows)

    # Shuffle
    df = df.sample(frac=1.0, random_state=SEED).reset_index(drop=True)

    print(f"\n  Total samples generated: {len(df)}")
    print(f"\n  Class distribution:")
    for label_idx, label_name in enumerate(RISK_LABELS):
        count = (df["label"] == label_idx).sum()
        pct = count / len(df) * 100
        print(f"    {label_name:12s}: {count:5d} ({pct:5.1f}%)")

    csv_path = "dataset.csv"
    df.to_csv(csv_path, index=False)
    print(f"\n  Dataset saved to: {csv_path}")

    return df


# ═══════════════════════════════════════════════════════════════════════════════
# 2. MODEL TRAINING & EVALUATION
# ═══════════════════════════════════════════════════════════════════════════════

def train_model(df):
    """Train RandomForestClassifier and evaluate per-class metrics.

    Returns model, feature importance dict, accuracy, and full report dict.
    """
    print("\n" + "═" * 60)
    print("  3rd Vision ML — Model Training")
    print("═" * 60)

    X = df[FEATURE_NAMES].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )

    print(f"\n  Training set: {len(X_train)} samples")
    print(f"  Test set:     {len(X_test)} samples")

    # Train
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=18,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=SEED,
        n_jobs=-1,
    )

    print("\n  Training RandomForestClassifier (n_estimators=200)...")
    model.fit(X_train, y_train)
    print("  [OK] Training complete.")

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n  Overall Accuracy: {accuracy:.4f} ({accuracy * 100:.1f}%)")

    print("\n  Per-Class Metrics:")
    print("  " + "-" * 56)
    report = classification_report(
        y_test, y_pred, target_names=RISK_LABELS, digits=3, output_dict=False
    )
    for line in report.split("\n"):
        print(f"  {line}")

    print("\n  Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"  {'':12s}  " + "  ".join(f"{n:>9s}" for n in RISK_LABELS))
    for i, row in enumerate(cm):
        print(f"  {RISK_LABELS[i]:12s}  " + "  ".join(f"{v:9d}" for v in row))

    # Feature importance (global/model-level measure only)
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]

    print("\n  Important Model Features (global/model-level measure):")
    print("  NOTE: These reflect the model's overall feature utilisation,")
    print("        NOT causal contribution for any individual prediction.")
    print("  " + "-" * 40)
    importance_dict = {}
    for rank, idx in enumerate(sorted_idx, 1):
        name = FEATURE_NAMES[idx]
        imp = importances[idx]
        importance_dict[name] = round(float(imp), 4)
        bar = "#" * int(imp * 40)
        print(f"  {rank:2d}. {name:22s} {imp:.4f}  {bar}")

    # Per-class recall reporting (neutral — no claimed safety threshold)
    report_dict = classification_report(
        y_test, y_pred, target_names=RISK_LABELS, digits=3, output_dict=True
    )
    critical_recall = report_dict.get("CRITICAL", {}).get("recall", 0.0)
    safe_recall = report_dict.get("SAFE", {}).get("recall", 0.0)
    warning_recall = report_dict.get("WARNING", {}).get("recall", 0.0)
    high_risk_recall = report_dict.get("HIGH_RISK", {}).get("recall", 0.0)

    print(f"\n  Per-Class Recall on Synthetic Test Set:")
    print(f"    SAFE recall:      {safe_recall:.3f}")
    print(f"    WARNING recall:   {warning_recall:.3f}")
    print(f"    HIGH_RISK recall: {high_risk_recall:.3f}")
    print(f"    CRITICAL recall on the synthetic test set: {critical_recall:.3f}")
    print()
    print("  NOTE: These metrics reflect performance on synthetic prototype data")
    print("        and do NOT represent real-world mining safety performance.")
    print("        There is no scientifically established safety threshold")
    print("        for this prototype recall value.")

    return model, importance_dict, accuracy, report_dict


# ═══════════════════════════════════════════════════════════════════════════════
# 3. SAVE ARTIFACTS
# ═══════════════════════════════════════════════════════════════════════════════

def save_artifacts(model, importance_dict, accuracy, report_dict=None):
    """Save model and feature configuration."""
    model_path = "model.joblib"
    joblib.dump(model, model_path)
    print(f"\n  Model saved to: {model_path}")

    # Extract per-class metrics for config
    per_class_metrics = {}
    if report_dict:
        for label in RISK_LABELS:
            cls = report_dict.get(label, {})
            per_class_metrics[label] = {
                "precision": round(cls.get("precision", 0.0), 4),
                "recall": round(cls.get("recall", 0.0), 4),
                "f1_score": round(cls.get("f1-score", 0.0), 4),
                "support": int(cls.get("support", 0)),
            }

    config = {
        "model_version": MODEL_VERSION,
        "algorithm": "RandomForestClassifier",
        "n_features": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "risk_labels": RISK_LABELS,
        "feature_importance": importance_dict,
        "feature_importance_note": (
            "Global/model-level measure of feature utilisation. "
            "Does NOT describe causal contribution for any individual prediction."
        ),
        "accuracy": round(accuracy, 4),
        "per_class_metrics": per_class_metrics,
        "metrics_disclaimer": (
            "These metrics reflect performance on synthetic prototype data "
            "and do NOT represent real-world mining safety performance. "
            "There is no scientifically established safety recall threshold "
            "for this prototype system."
        ),
        "training_note": (
            "Trained on synthetic/prototype scenario data. "
            "NOT validated on real NMDC mine incident data. "
            "Labels generated from safety rules, not historical accidents. "
            "speed_kmh is excluded from rf-v1; the prototype hardware "
            "(ESP32 + HC-SR04 + MPU6500) has no physical speed sensor."
        ),
        "future_features_note": (
            "Optional telemetry (speed_kmh, latitude, longitude, heading_degrees, "
            "nearest_vehicle_distance_m, relative_speed_kmh, traffic_density, "
            "zone_speed_limit) may be incorporated in future rf-v2 models "
            "and are NOT required for rf-v1 inference."
        ),
    }

    config_path = "feature_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    print(f"  Feature config saved to: {config_path}")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print(f"\n  Model Version: {MODEL_VERSION}")
    print(f"  Features ({len(FEATURE_NAMES)}): {FEATURE_NAMES}")
    print(f"  Labels:        {RISK_LABELS}")
    print(f"  NOTE: speed_kmh is excluded from rf-v1 (no hardware speed sensor).\n")

    df = generate_dataset()
    model, importance_dict, accuracy, report_dict = train_model(df)
    save_artifacts(model, importance_dict, accuracy, report_dict)

    print("\n" + "=" * 60)
    print("  3rd Vision ML -- Training Pipeline Complete")
    print("=" * 60)
    print(f"  Model:    {MODEL_VERSION}")
    print(f"  Features: {len(FEATURE_NAMES)} (rf-v1, no speed sensor required)")
    print(f"  Accuracy: {accuracy * 100:.1f}%  [synthetic test set only]")
    print(f"  Files:    model.joblib, feature_config.json, dataset.csv")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
