"""
3rd Vision ML Service — Shared Preprocessing Module (rf-v1)
=========================================================
Used by BOTH train.py and main.py to ensure identical feature engineering.

Base rf-v1 Features (9 total):
    1. distance_m           — HC-SR04 ultrasonic distance
    2. approach_rate_mps    — Derived closing speed
    3. pitch                — MPU6500 pitch angle
    4. roll                 — MPU6500 roll angle
    5. accel_magnitude      — MPU6500 acceleration deviation: sqrt(ax² + ay² + (az-9.8)²)
    6. gyro_magnitude       — MPU6500 angular rate magnitude: sqrt(gx² + gy² + gz²)
    7. tilt_magnitude       — MPU6500 combined tilt magnitude: sqrt(pitch² + roll²)
    8. visibility_m         — Weather API (Open-Meteo)
    9. humidity_percent     — Weather API (Open-Meteo)

NOTE ON SPEED & OPTIONAL TELEMETRY:
    Physical prototype hardware (ESP32 + HC-SR04 + MPU6500) does NOT have a speed sensor.
    Therefore, `speed_kmh` is NOT part of the base rf-v1 feature schema.
    Optional telemetry (speed, GPS, relative vehicle speed) may be utilized by future models (e.g. rf-v2).
"""

import math
import numpy as np

# Canonical feature order for rf-v1 (9 features) — MUST match training and inference
FEATURE_NAMES = [
    "distance_m",
    "approach_rate_mps",
    "pitch",
    "roll",
    "accel_magnitude",
    "gyro_magnitude",
    "tilt_magnitude",
    "visibility_m",
    "humidity_percent",
]

RISK_LABELS = ["SAFE", "WARNING", "HIGH_RISK", "CRITICAL"]
MODEL_VERSION = "rf-v1"


def safe_float(value, default=0.0):
    """Convert a value to float, returning default if None or invalid."""
    if value is None:
        return default
    try:
        v = float(value)
        return v if math.isfinite(v) else default
    except (ValueError, TypeError):
        return default


def compute_accel_magnitude(ax, ay, az):
    """Magnitude of acceleration deviation from gravity (1g ≈ 9.8 m/s²)."""
    return math.sqrt(ax ** 2 + ay ** 2 + (az - 9.8) ** 2)


def compute_gyro_magnitude(gx, gy, gz):
    """Magnitude of angular velocity vector."""
    return math.sqrt(gx ** 2 + gy ** 2 + gz ** 2)


def compute_tilt_magnitude(pitch, roll):
    """Combined tilt angle magnitude."""
    return math.sqrt(pitch ** 2 + roll ** 2)


def extract_features(payload: dict) -> np.ndarray:
    """
    Extract the 9-feature vector from an incoming prediction payload for rf-v1.

    Accepts both camelCase (from Node.js backend / frontend) and snake_case field names.
    Supports raw IMU axes (ax, ay, az, gx, gy, gz) OR precomputed magnitudes
    (accelMagnitude, gyroMagnitude, tiltMagnitude).

    Returns:
        np.ndarray of shape (1, 9) ready for model.predict()
    """
    # 1. Distance & Approach Rate
    distance_m = safe_float(
        payload.get("distanceMeters") or payload.get("distance_m"), default=25.0
    )
    approach_rate_mps = safe_float(
        payload.get("approachRateMps") or payload.get("approach_rate_mps"), default=0.0
    )

    # 2. Angles
    pitch = safe_float(payload.get("pitch"), default=0.0)
    roll = safe_float(payload.get("roll"), default=0.0)

    # 3. Acceleration Magnitude (accept precomputed or calculate from axes)
    accel_mag_in = payload.get("accelMagnitude") or payload.get("accel_magnitude")
    if accel_mag_in is not None:
        accel_magnitude = safe_float(accel_mag_in, default=0.0)
    else:
        ax = safe_float(payload.get("accel_x") or payload.get("ax"), default=0.0)
        ay = safe_float(payload.get("accel_y") or payload.get("ay"), default=0.0)
        az = safe_float(payload.get("accel_z") or payload.get("az"), default=9.8)
        accel_magnitude = compute_accel_magnitude(ax, ay, az)

    # 4. Gyroscope Magnitude (accept precomputed or calculate from axes)
    gyro_mag_in = payload.get("gyroMagnitude") or payload.get("gyro_magnitude")
    if gyro_mag_in is not None:
        gyro_magnitude = safe_float(gyro_mag_in, default=0.0)
    else:
        gx = safe_float(payload.get("gyro_x") or payload.get("gx"), default=0.0)
        gy = safe_float(payload.get("gyro_y") or payload.get("gy"), default=0.0)
        gz = safe_float(payload.get("gyro_z") or payload.get("gz"), default=0.0)
        gyro_magnitude = compute_gyro_magnitude(gx, gy, gz)

    # 5. Tilt Magnitude (accept precomputed or calculate from pitch/roll)
    tilt_mag_in = payload.get("tiltMagnitude") or payload.get("tilt_magnitude")
    if tilt_mag_in is not None:
        tilt_magnitude = safe_float(tilt_mag_in, default=0.0)
    else:
        tilt_magnitude = compute_tilt_magnitude(pitch, roll)

    # 6. Weather
    visibility_m = safe_float(
        payload.get("visibilityMeters") or payload.get("visibility_m"), default=25.0
    )
    humidity_percent = safe_float(
        payload.get("humidityPercent") or payload.get("humidity_percent"), default=60.0
    )

    # --- Clamp features to physical bounds ---
    distance_m = max(0.0, min(distance_m, 500.0))
    approach_rate_mps = max(-20.0, min(approach_rate_mps, 30.0))
    pitch = max(-90.0, min(pitch, 90.0))
    roll = max(-90.0, min(roll, 90.0))
    accel_magnitude = max(0.0, min(accel_magnitude, 50.0))
    gyro_magnitude = max(0.0, min(gyro_magnitude, 20.0))
    tilt_magnitude = max(0.0, min(tilt_magnitude, 180.0))
    visibility_m = max(0.0, min(visibility_m, 100.0))
    humidity_percent = max(0.0, min(humidity_percent, 100.0))

    feature_vector = np.array([[
        distance_m,
        approach_rate_mps,
        pitch,
        roll,
        accel_magnitude,
        gyro_magnitude,
        tilt_magnitude,
        visibility_m,
        humidity_percent,
    ]])

    return feature_vector


def extract_features_batch(df):
    """
    Extract 9-feature matrix from a pandas DataFrame (used during training).
    Returns:
        np.ndarray of shape (n_samples, 9)
    """
    return df[FEATURE_NAMES].values
