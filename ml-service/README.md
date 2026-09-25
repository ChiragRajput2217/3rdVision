# 3rd Vision ML Risk Estimation Service

An independent Python microservice that provides machine-learning-based **decision-support risk estimation** for the 3rd Vision Node.js backend.

> ⚠️ **IMPORTANT SAFETY & LIMITATION DISCLAIMER**
> - **Decision Support Only:** This ML service is an auxiliary advisory component. It does NOT directly actuate vehicle brakes, throttle, or steering.
> - **Synthetic Prototype Data:** The included model (`rf-v1`) is trained on synthetic safety-rule scenario data designed around the physical ESP32 prototype hardware (HC-SR04 ultrasonic sensor + MPU6500 IMU).
> - **Not Certified:** This model is **NOT** trained or validated on real-world industrial mining incident datasets and must **NOT** be represented as an industrial-certified collision avoidance system.
> - **No Speed Sensor:** The prototype hardware has no physical speed sensor. `speed_kmh` is intentionally excluded from `rf-v1`.
> - **Metrics Caveat:** All reported metrics (accuracy, precision, recall, F1) reflect performance on synthetic prototype test data and do **NOT** represent real-world mining safety performance.

---

## Architecture

```
                    ┌─────────────────────────┐
                    │     ESP32 Prototype     │
                    │ (HC-SR04 + MPU6500 IMU) │
                    └────────────┬────────────┘
                                 │ USB Serial
                                 ▼
                    ┌─────────────────────────┐
                    │  Node.js Main Backend   │
                    │      (Port 5000)        │
                    └────────────┬────────────┘
                                 │ HTTP POST /predict
                                 ▼
┌───────────────────────────────────────────────────────────┐
│               Python ML Service (Port 8000)                │
│                                                           │
│  FastAPI  ──►  preprocess.py  ──►  RandomForest (rf-v1)   │
└───────────────────────────────────────────────────────────┘
```

---

## rf-v1 Feature Vector (9 Features)

The model evaluates **9 features** derived from hardware sensors and weather API data. **No speed sensor is required.**

| # | Feature | Unit | Source | Description |
|---|---|---|---|---|
| 1 | `distance_m` | m | HC-SR04 | Measured ultrasonic obstacle distance |
| 2 | `approach_rate_mps` | m/s | Derived | Rate of distance decrease over time |
| 3 | `pitch` | deg | MPU6500 | Vehicle pitch angle |
| 4 | `roll` | deg | MPU6500 | Vehicle roll angle |
| 5 | `accel_magnitude` | m/s² | MPU6500 | Accel deviation from gravity: $\sqrt{a_x^2 + a_y^2 + (a_z-9.8)^2}$ |
| 6 | `gyro_magnitude` | rad/s | MPU6500 | Angular rate vector magnitude: $\sqrt{g_x^2 + g_y^2 + g_z^2}$ |
| 7 | `tilt_magnitude` | deg | MPU6500 | Combined tilt angle: $\sqrt{\text{pitch}^2 + \text{roll}^2}$ |
| 8 | `visibility_m` | m | Weather API | Atmospheric visibility in haul zone |
| 9 | `humidity_percent` | % | Weather API | Relative atmospheric humidity |

### Why No Speed?

The physical ESP32 prototype uses HC-SR04 (ultrasonic) + MPU6500 (IMU). There is no hardware speed sensor. Including `speed_kmh = 0` as a fake feature would create a **training/inference mismatch** and is intentionally avoided.

### Future rf-v2 Optional Fields

Future model versions may incorporate additional telemetry where available:
`speed_kmh`, `latitude`, `longitude`, `heading_degrees`, `nearest_vehicle_distance_m`, `relative_speed_kmh`, `traffic_density`, `zone_speed_limit`

These are optional and simulation-only fields — not required for rf-v1.

---

## Synthetic Training Scenarios

The dataset is generated from six physically meaningful scenario classes:

| Scenario | Key Conditions | Label |
|---|---|---|
| **SAFE** | Large distance, slow/no approach, clear weather, stable IMU | `SAFE` |
| **WARNING** | Moderate distance + approach rate, some fog/tilt | `WARNING` |
| **HIGH_RISK** | Close distance (4–16 m), high approach rate correlated with decreasing distance, low visibility + high humidity | `HIGH_RISK` |
| **CRITICAL** | Very close (0.5–8 m), approach rate strongly increases as distance drops, dense fog | `CRITICAL` |
| **HIGH_TILT** | Extreme pitch/roll (tilt > 25° → CRITICAL, else HIGH_RISK) | `HIGH_RISK` / `CRITICAL` |
| **SENSOR_NOISE** | High measurement variance, fog, erratic IMU | `WARNING` / `HIGH_RISK` |

Temporal correlations preserved:
- Approaching hazard: distance ↓ + approach rate ↑ → risk ↑
- Dense fog: visibility ↓ + humidity ↑ → risk ↑
- High tilt: pitch/roll magnitude ↑ → risk ↑
- Sensor noise: variance ↑ → confidence ↓

---

## Setup & Installation

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Train Model Pipeline

```bash
python train.py
```

Outputs:
- `dataset.csv` — ~6,000 synthetic telemetry samples across 6 scenarios
- `model.joblib` — Trained `RandomForestClassifier` artifact (9-feature rf-v1)
- `feature_config.json` — Feature order, importances, per-class metrics, and disclaimers

### 3. Run Service

```bash
python main.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Service starts at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

---

## API Endpoints

### 1. Health Check
`GET /health`

```json
{
  "status": "healthy",
  "service": "3rd Vision ML Risk Estimation Service",
  "modelVersion": "rf-v1",
  "modelLoaded": true,
  "featuresCount": 9,
  "algorithm": "RandomForestClassifier"
}
```

### 2. Single Prediction (Used by Node.js backend)
`POST /predict`

Accepts both camelCase and snake_case. Hardware-compatible example (no speed required):

```json
{
  "distanceMeters": 3.5,
  "approachRateMps": 6.2,
  "pitch": 4.0,
  "roll": 2.0,
  "accelMagnitude": 0.4,
  "gyroMagnitude": 1.1,
  "tiltMagnitude": 4.5,
  "visibilityMeters": 4.0,
  "humidityPercent": 91
}
```

Response:
```json
{
  "riskScore": 87.3,
  "riskLevel": "CRITICAL",
  "confidence": 0.921,
  "modelVersion": "rf-v1",
  "probabilities": {
    "SAFE": 0.003,
    "WARNING": 0.021,
    "HIGH_RISK": 0.055,
    "CRITICAL": 0.921
  },
  "disclaimer": "Synthetic prototype prediction — decision support only."
}
```

> **Output field naming:** The output uses `riskScore`, `riskLevel`, and `confidence` — not "collision probability". The model outputs an **estimated risk score** derived from synthetic scenario data, not a validated collision outcome probability.

### 3. Batch Prediction
`POST /batch-predict`

Accepts a JSON array of telemetry objects and returns batch prediction results.

### 4. Model Metadata
`GET /model-info`

Returns:
- Feature list and expected order
- **Important model features** (global/model-level measure of feature utilisation — **not** a causal contribution per individual prediction)
- Overall accuracy on synthetic test set
- Per-class precision, recall, F1 on synthetic test set

---

## Model Performance (Synthetic Test Set)

> **⚠️ Metrics Disclaimer:** All metrics below reflect performance on the synthetic prototype test set. They do **NOT** represent real-world mining safety performance. There is no scientifically established safety recall threshold for this prototype system.

Per-class metrics are reported for:
- **SAFE** — recall, precision, F1
- **WARNING** — recall, precision, F1
- **HIGH_RISK** — recall, precision, F1
- **CRITICAL** — recall, precision, F1 (reported as "CRITICAL recall on the synthetic test set: XX%")

Full metrics are available at `/model-info` after training.

---

## Fallback Behaviour

If `model.joblib` is missing or fails to load, the service automatically falls back to a **rule-based risk estimator** using distance, approach rate, and visibility. The response will include `"modelVersion": "v1.0-rules-fallback"`.

---

## Node.js Integration

The Node.js backend (`backend/risk.js`) calls `POST /predict` with camelCase fields. Extra fields like `speedKmh` sent by legacy callers are silently ignored by the ML model — the endpoint accepts them without error (`extra = "allow"` in the Pydantic schema).

---

## Model Versioning

- Current: `rf-v1` — 9-feature, no speed sensor required
- Future: `rf-v2` — may add optional telemetry (speed, GPS, inter-vehicle distance)
