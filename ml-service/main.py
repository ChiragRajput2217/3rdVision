"""
3rd Vision ML Service — FastAPI Server
=====================================
Independent microservice serving ML-based decision-support risk predictions
for the 3rd Vision Node.js backend.

Endpoints:
    - GET  /health          Health status and model loading state
    - POST /predict         Predict risk score & level for a single telemetry payload
    - POST /batch-predict   Predict risk for multiple telemetry payloads
    - GET  /model-info      Return model metadata, accuracy, and feature importances

Run:
    python main.py
    # OR
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import json
import logging
import os
import sys
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

from preprocess import (
    FEATURE_NAMES,
    MODEL_VERSION,
    RISK_LABELS,
    extract_features,
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("minesafe-ml")

# Global model state
MODEL = None
CONFIG = {}


def load_model_and_config():
    """Load trained joblib model and JSON feature config from disk."""
    global MODEL, CONFIG
    model_path = os.path.join(os.path.dirname(__file__), "model.joblib")
    config_path = os.path.join(os.path.dirname(__file__), "feature_config.json")

    if os.path.exists(model_path):
        try:
            MODEL = joblib.load(model_path)
            logger.info(f"[OK] Loaded ML model from {model_path}")
        except Exception as e:
            logger.error(f"[ERROR] Failed to load model from {model_path}: {e}")
            MODEL = None
    else:
        logger.warning(f"[WARN] Model file not found at {model_path}. Will use rule-based fallback.")
        MODEL = None

    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                CONFIG = json.load(f)
            logger.info(f"[OK] Loaded feature config from {config_path}")
        except Exception as e:
            logger.error(f"[ERROR] Failed to load config from {config_path}: {e}")
            CONFIG = {}
    else:
        CONFIG = {
            "model_version": MODEL_VERSION,
            "algorithm": "RandomForestClassifier",
            "n_features": len(FEATURE_NAMES),
            "feature_names": FEATURE_NAMES,
            "risk_labels": RISK_LABELS,
            "training_note": "Fallback config (file not found)",
        }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan handler to initialize model on startup."""
    load_model_and_config()
    yield
    logger.info("ML Service shutting down.")


app = FastAPI(
    title="3rd Vision ML Risk Estimation Service",
    description=(
        "Decision-support machine learning service for 3rd Vision vehicle risk evaluation. "
        "Outputs estimated risk score (0-100), risk level classification, and model confidence. "
        "rf-v1 uses 9 features derived from HC-SR04 ultrasonic sensor, MPU6500 IMU, and weather API. "
        "NOTE: Trained on synthetic prototype data — decision-support only; "
        "not an industrial-certified collision avoidance system."
    ),
    version=MODEL_VERSION,
    lifespan=lifespan,
)

# Allow CORS for Node.js backend and frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic Data Models ───────────────────────────────────────────────────

class TelemetryPayload(BaseModel):
    """
    rf-v1 telemetry payload — accepts both camelCase (Node.js) and snake_case.

    Required rf-v1 features (9):
        distance_m / distanceMeters    — HC-SR04 ultrasonic distance
        approach_rate_mps              — Derived closing rate
        pitch, roll                    — MPU6500 angles
        accel_magnitude / IMU axes     — Acceleration deviation
        gyro_magnitude  / IMU axes     — Angular rate magnitude
        tilt_magnitude  (auto-derived) — Combined tilt angle
        visibility_m / visibilityMeters — Weather API
        humidity_percent / humidityPercent — Weather API

    NOTE: speed_kmh is NOT a required rf-v1 feature. The prototype hardware
    (ESP32 + HC-SR04 + MPU6500) has no physical speed sensor. Any speedKmh
    field sent by legacy Node.js callers is silently ignored by the ML model.
    """
    # ── Distance (required for meaningful prediction)
    distanceMeters: Optional[float] = Field(None, description="HC-SR04 ultrasonic distance in meters")
    distance_m: Optional[float] = None

    # ── Approach rate
    approachRateMps: Optional[float] = Field(None, description="Closing rate in meters per second (positive = closing)")
    approach_rate_mps: Optional[float] = None

    # ── IMU angles
    pitch: Optional[float] = Field(None, description="MPU6500 pitch angle in degrees")
    roll: Optional[float] = Field(None, description="MPU6500 roll angle in degrees")

    # ── Precomputed IMU magnitudes (if hardware sends them directly)
    accelMagnitude: Optional[float] = Field(None, description="Precomputed acceleration magnitude (m/s²)")
    accel_magnitude: Optional[float] = None
    gyroMagnitude: Optional[float] = Field(None, description="Precomputed gyroscope magnitude (rad/s)")
    gyro_magnitude: Optional[float] = None
    tiltMagnitude: Optional[float] = Field(None, description="Precomputed tilt magnitude (degrees)")
    tilt_magnitude: Optional[float] = None

    # ── Raw IMU axes (used to compute magnitudes when precomputed not available)
    accel_x: Optional[float] = None
    accel_y: Optional[float] = None
    accel_z: Optional[float] = None
    ax: Optional[float] = None
    ay: Optional[float] = None
    az: Optional[float] = None
    gyro_x: Optional[float] = None
    gyro_y: Optional[float] = None
    gyro_z: Optional[float] = None
    gx: Optional[float] = None
    gy: Optional[float] = None
    gz: Optional[float] = None

    # ── Weather (from Open-Meteo API or similar)
    visibilityMeters: Optional[float] = Field(None, description="Atmospheric visibility in meters")
    visibility_m: Optional[float] = None
    humidityPercent: Optional[float] = Field(None, description="Relative humidity percentage")
    humidity_percent: Optional[float] = None

    # ── Sensor confidence (optional — kept separate from model confidence)
    # Future rf-v2 optional fields: speedKmh, latitude, longitude,
    # headingDegrees, nearestVehicleDistance, relativeSpeedKmh, etc.
    # These are intentionally NOT part of rf-v1 and will be ignored if sent.

    model_config = ConfigDict(
        extra="allow",
        json_schema_extra={
            "example": {
                "distanceMeters": 3.5,
                "approachRateMps": 6.2,
                "pitch": 4.0,
                "roll": 2.0,
                "accelMagnitude": 0.4,
                "gyroMagnitude": 1.1,
                "tiltMagnitude": 4.5,
                "visibilityMeters": 4.0,
                "humidityPercent": 91,
            }
        },
    )


class PredictionResponse(BaseModel):
    riskScore: float = Field(..., description="Continuous risk score from 0.0 to 100.0")
    riskLevel: str = Field(..., description="SAFE | WARNING | HIGH_RISK | CRITICAL")
    confidence: float = Field(..., description="Model confidence score between 0.0 and 1.0")
    modelVersion: str = Field(..., description="Model version identifier")
    probabilities: Dict[str, float] = Field(..., description="Per-class predicted probability distribution")
    disclaimer: str = Field(
        "Synthetic prototype prediction — decision support only. Not an industrial collision controller.",
        description="Mandatory disclaimer for prototype usage"
    )


class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    count: int


# ─── Prediction Logic ───────────────────────────────────────────────────────

def predict_single(data: dict) -> dict:
    """Run model inference or rule-based fallback on a telemetry dictionary."""
    feature_vector = extract_features(data)

    if MODEL is not None:
        try:
            probs = MODEL.predict_proba(feature_vector)[0]
            # Classes are [SAFE, WARNING, HIGH_RISK, CRITICAL] -> index 0, 1, 2, 3
            p_safe, p_warn, p_high, p_crit = probs[0], probs[1], probs[2], probs[3]

            # Continuous risk score: weighted combination mapped to 0-100
            raw_score = (p_safe * 10.0) + (p_warn * 40.0) + (p_high * 75.0) + (p_crit * 98.0)
            risk_score = round(float(raw_score), 1)

            predicted_idx = int(np.argmax(probs))
            risk_level = RISK_LABELS[predicted_idx]
            confidence = round(float(probs[predicted_idx]), 3)

            probabilities = {
                RISK_LABELS[i]: round(float(p), 4) for i, p in enumerate(probs)
            }
            version = CONFIG.get("model_version", MODEL_VERSION)

            return {
                "riskScore": risk_score,
                "riskLevel": risk_level,
                "confidence": confidence,
                "modelVersion": version,
                "probabilities": probabilities,
                "disclaimer": "Synthetic prototype prediction — decision support only.",
            }
        except Exception as e:
            logger.error(f"Inference error, dropping to fallback: {e}")

    # --- Rule-Based Fallback if Model is missing or fails ---
    dist = float(data.get("distanceMeters") or data.get("distance_m") or 25.0)
    approach = float(data.get("approachRateMps") or data.get("approach_rate_mps") or 0.0)
    vis = float(data.get("visibilityMeters") or data.get("visibility_m") or 25.0)

    score = 15.0
    if dist < 5.0 or (dist < 10.0 and approach > 4.0):
        score = 90.0
        level = "CRITICAL"
    elif dist < 15.0 or vis < 8.0:
        score = 65.0
        level = "HIGH_RISK"
    elif dist < 25.0 or approach > 2.0:
        score = 40.0
        level = "WARNING"
    else:
        score = 15.0
        level = "SAFE"

    return {
        "riskScore": score,
        "riskLevel": level,
        "confidence": 0.85,
        "modelVersion": "v1.0-rules-fallback",
        "probabilities": {
            "SAFE": 0.25 if level != "SAFE" else 0.85,
            "WARNING": 0.25 if level != "WARNING" else 0.85,
            "HIGH_RISK": 0.25 if level != "HIGH_RISK" else 0.85,
            "CRITICAL": 0.25 if level != "CRITICAL" else 0.85,
        },
        "disclaimer": "Rule-based fallback estimation — decision support only.",
    }


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health", summary="Health check")
async def health_check():
    """Returns service status and model loading information."""
    return {
        "status": "healthy",
        "service": "3rd Vision ML Risk Estimation Service",
        "modelVersion": CONFIG.get("model_version", MODEL_VERSION),
        "modelLoaded": MODEL is not None,
        "featuresCount": len(FEATURE_NAMES),
        "algorithm": CONFIG.get("algorithm", "RandomForestClassifier"),
    }


@app.post("/predict", response_model=PredictionResponse, summary="Predict risk for single telemetry payload")
async def predict_endpoint(request: Request):
    """
    Accepts telemetry payload (camelCase or snake_case) and returns risk evaluation.
    Node.js backend integrates with this endpoint directly.
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    result = predict_single(data)
    return result


@app.post("/batch-predict", response_model=BatchPredictionResponse, summary="Predict risk for batch of payloads")
async def batch_predict_endpoint(payloads: List[Dict[str, Any]]):
    """Accepts a list of telemetry payloads and returns batch predictions."""
    if not isinstance(payloads, list):
        raise HTTPException(status_code=400, detail="Payload must be a JSON list")

    results = [predict_single(p) for p in payloads]
    return {
        "predictions": results,
        "count": len(results),
    }


@app.get("/model-info", summary="Get detailed model metadata")
async def model_info():
    """Returns feature list, feature importances, accuracy, and training notes."""
    return {
        "config": CONFIG,
        "modelLoaded": MODEL is not None,
        "supportedFeatures": FEATURE_NAMES,
        "riskLabels": RISK_LABELS,
    }


# ─── Main Execution ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    reload = os.getenv("RELOAD", "false").lower() in ("true", "1")
    logger.info(f"Starting 3rd Vision ML Service on http://{host}:{port} (reload={reload}) ...")
    uvicorn.run("main:app", host=host, port=port, reload=reload)
