# 3rd Vision — MineSafe
> **Smart Low-Visibility Collision Avoidance & Risk Management System for Open-Cast Mines**  
> *SIH Problem 26007: Safe and Efficient Operation of Mine Vehicles in Fog and Low-Visibility Conditions*

---

## 1. System Architecture

```
                       ┌────────────────────────────────────────────────────────┐
                       │               EXTERNAL HARDWARE SIMULATOR              │
                       │          https://3rdvisionsimulator.vercel.app         │
                       └───────────────────────────┬────────────────────────────┘
                                                   │ HTTP POST /api/hardware/ingest
                                                   │ { rawPacket, persist: false }
                                                   ▼
┌────────────────────────┐              ┌───────────────────────────────────────┐
│     REAL HARDWARE      │              │           NODE.JS BACKEND             │
│ ESP32_SENSOR_01 (Node) │              │          (Express + Socket.IO)        │
│  MPU6500 + HC-SR04     │              │               [Railway]               │
│          │             │              └───────┬───────────────────────┬───────┘
│   ESP-NOW (Wireless)   │                      │                       │
│          ▼             │                      │ POST /predict         │ Socket.IO
│ ESP32_RX_01 (Gateway)  │                      ▼ (9 features)          │ (Realtime)
│          │             │              ┌───────────────┐               ▼
│   USB Serial (COM5)    │              │  ML SERVICE   │       ┌───────────────┐
│          ▼             │              │  (FastAPI +   │       │ REACT FRONTEND│
│   hardwareConnector    │              │ RandomForest) │       │ (Vite + TS)   │
│  (persist: true)       │              │   [Render]    │       │   [Vercel]    │
└──────────┬─────────────┘              └───────────────┘       └───────┬───────┘
           │                                                            │
           └──────────────────┐                                         │
                              ▼                                         │
                   ┌──────────────────────┐                             │
                   │ SUPABASE POSTGRESQL  │◄────────────────────────────┘
                   │ (sensor_readings,    │   (Admin API via Backend)
                   │  vehicle_telemetry)  │
                   └──────────────────────┘
```

### Critical Data-Path Rule: Hardware vs Simulation Persistence

| Dimension | Real Hardware Path (COM5) | External Simulator Path (HTTP Ingest) |
| :--- | :--- | :--- |
| **Transport** | USB Serial via Gateway (`ESP32_RX_01`) | HTTP `POST /api/hardware/ingest` |
| **Persistence Flag** | `persist: true` (default) | `persist: false` (explicit in payload) |
| **Packet Normalization** | Active (`decodeRawPacket` → `mapSemantics`) | Active (`decodeRawPacket` → `mapSemantics`) |
| **Derived Calculations** | Active (approach rate, tilt, motion) | Active (approach rate, tilt, motion) |
| **Risk Engine** | Active (Proximity, fog, grade, overspeed) | Active (Proximity, fog, grade, overspeed) |
| **ML Inference** | Active (`POST /predict` 9 features) | Active (`POST /predict` 9 features) |
| **Realtime Broadcast** | Emits `sensor:update`, `vehicle:update`, `risk:update` | Emits `sensor:update`, `vehicle:update`, `risk:update` |
| **Supabase DB Write** | **YES** (`sensor_readings`, `vehicle_telemetry`) | **NO** (Zero rows written — transient stream) |

---

## 2. Hardware Topology

- **Sensor Node (`ESP32_SENSOR_01`)**:
  - Attached Sensors: **HC-SR04** (ultrasonic distance), **MPU6500** (6-DOF IMU).
  - Actuators: Servo motor, Buzzer, Warning LED bar.
  - Role: Autonomous edge sensing & collision warning, transmits raw packets wirelessly via **ESP-NOW**.
  - Laptop Connection: **None** (battery powered).
- **Receiver / Gateway (`ESP32_RX_01`)**:
  - Role: Transparent ESP-NOW to USB-Serial gateway.
  - Laptop Connection: **USB Serial** (COM5 @ 115200 baud).

### Raw Packet Format
```csv
DATA,F1,F2,F3,F4,F5,F6,F7,F8
```
- `F1`: Packet sequence counter (integer)
- `F2`: Ultrasonic distance in cm (float)
- `F3`: Accel X in g (float)
- `F4`: Accel Y in g (float)
- `F5`: Accel Z in g (float, 0 = suppressed/unavailable)
- `F6`: Gyro X in deg/s (float)
- `F7`: ESP-NOW RSSI in dBm (e.g. `-57`)
- `F8`: Hardware valid flag (`1` = valid)

---

## 3. Local Development Setup

### Prerequisites
- Node.js 20+ LTS or 22+
- Python 3.10+
- Git

### 1. ML Service (FastAPI)
```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
# Server starts on http://localhost:8000
# Health check: http://localhost:8000/health
```

### 2. Backend (Node.js + Express + Socket.IO)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm start
# Server starts on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 3. Frontend (React + Vite)
```bash
# In project root:
npm install
cp .env.example .env
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 4. Production Deployment Guide

### A. ML Service Deployment (Render)
1. In the Render Dashboard, create a **Web Service**.
2. Connect your Git repository.
3. Settings:
   - **Root Directory**: `ml-service`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Note your public URL (e.g., `https://minesafe-ml.onrender.com`).

### B. Backend Deployment (Railway)
1. In Railway, create a **New Project** from GitHub repo.
2. Settings:
   - **Root Directory**: `backend`
   - **Start Command**: `node server.js`
3. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `${PORT}` (auto-assigned by Railway)
   - `HARDWARE_ENABLED`: `false` (disables serial COM port access in cloud)
   - `OPERATION_MODE`: `SIMULATION`
   - `SUPABASE_URL`: `https://<your-project-ref>.supabase.co`
   - `SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY`: `<your-supabase-service-role-key>`
   - `ML_ENABLED`: `true`
   - `ML_SERVICE_URL`: `https://minesafe-ml.onrender.com/predict`
   - `ML_TIMEOUT_MS`: `800`
   - `CORS_ORIGIN`: `https://<your-vercel-frontend-domain>,https://3rdvisionsimulator.vercel.app`
4. Deploy and copy the public Railway domain (e.g., `https://minesafe-backend.up.railway.app`).

### C. Frontend Deployment (Vercel)
1. In Vercel, import your Git repository.
2. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (project root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://minesafe-backend.up.railway.app/api`
   - `VITE_SOCKET_URL`: `https://minesafe-backend.up.railway.app`
   - `VITE_DEMO_MODE`: `false`
   - `VITE_GOOGLE_MAPS_API_KEY`: `<your-google-maps-api-key>`
4. Deploy.

---

## 5. Machine Learning Features & Model Schema

The `rf-v1` Random Forest classifier evaluates collision hazard from 9 synchronized features:
1. `distance_m`: Ultrasonic distance to preceding vehicle or obstacle (meters)
2. `approach_rate_mps`: Calculated closing velocity rate (m/s)
3. `pitch`: Vehicle longitudinal incline (degrees) from MPU6500
4. `roll`: Vehicle lateral tilt (degrees) from MPU6500
5. `accel_magnitude`: Dynamic acceleration magnitude deviation ($m/s^2$)
6. `gyro_magnitude`: Angular rate rotation intensity ($deg/s$)
7. `tilt_magnitude`: Combined inclination $\sqrt{pitch^2 + roll^2}$ (degrees)
8. `visibility_m`: Atmospheric visibility distance from meteorological API (meters)
9. `humidity_percent`: Relative atmospheric humidity (%)

**Fallback Guarantee**: If the ML service is unreachable or exceeds timeout, the backend seamlessly falls back to the deterministic safety risk engine with zero service interruption or process crash.

---

## 6. Verification & Health Checks

| Component | Endpoint | Expected Output |
| :--- | :--- | :--- |
| **Backend Health** | `GET /api/health` | `status: "HEALTHY"`, `database: "ONLINE"`, `supabase: "ONLINE"`, `ml: "ENABLED"` |
| **Hardware Status** | `GET /api/hardware/status` | `connectionState: "NETWORK_INGEST"` or `"DISCONNECTED"` |
| **ML Health** | `GET /health` | `status: "healthy"`, `modelLoaded: true`, `modelVersion: "rf-v1"`, `featuresCount: 9` |
| **Telemetry Ingestion** | `POST /api/hardware/ingest` | `{ success: true, packetCount: N, persist: false }` |
