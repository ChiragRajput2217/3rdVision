-- =====================================================================
-- MineSafe: Supabase PostgreSQL Cloud Database Schema (Finalized)
-- SIH Problem Statement ID: 26007
-- Safe and Efficient Operation of Mine Vehicles in Fog & Low-Visibility
--
-- Hardware Topology (two-node ESP32):
--   ESP32 #1  SENSOR_NODE     — MPU6500 (IMU), HC-SR04 (distance),
--                               Servo, Buzzer, Warning LED, 9-seg LED bar
--                               Transmits via ESP-NOW (wireless)
--   ESP32 #2  RECEIVER/GATEWAY— Receives ESP-NOW → forwards over USB Serial
--                               Only device connected to Windows laptop
--
-- Backend connects ONLY to the RECEIVER/GATEWAY (ESP32 #2) via USB Serial.
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    auth_uid TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SITE_ADMIN', 'CONTROL_ROOM_OPERATOR', 'VEHICLE_OPERATOR', 'MANAGEMENT')),
    site_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SITES TABLE
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPERATIONAL' CHECK (status IN ('OPERATIONAL', 'WARNING', 'CRITICAL', 'MAINTENANCE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ZONES TABLE
CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    polygon JSONB NOT NULL DEFAULT '[]'::jsonb,
    max_speed DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    risk_level TEXT NOT NULL DEFAULT 'SAFE' CHECK (risk_level IN ('SAFE', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME')),
    is_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
    code TEXT NOT NULL UNIQUE, -- e.g. D-104
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('DUMPER', 'EXCAVATOR', 'HAUL_TRUCK', 'DRILL_RIG', 'PATROL')),
    model TEXT,
    operator_id TEXT,
    operator_name TEXT,
    operator_phone TEXT,
    simulated BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'SAFE' CHECK (status IN ('SAFE', 'WARNING', 'HIGH_RISK', 'CRITICAL')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SENSORS TABLE
-- Physical prototype sensors: HC_SR04 (ultrasonic) and MPU6500 (accel/gyro)
-- Future industrial sensor types retained for forward compatibility but flagged as is_future_deployment
CREATE TABLE IF NOT EXISTS sensors (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('HC_SR04', 'MPU6500', 'RADAR', 'LIDAR', 'GPS', 'VISIBILITY', 'GAS', 'VIBRATION')),
    device_id TEXT,
    status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'DEGRADED', 'OFFLINE', 'FAULT')),
    source TEXT NOT NULL DEFAULT 'HARDWARE' CHECK (source IN ('HARDWARE', 'SIMULATION', 'WEATHER_API', 'DERIVED')),
    confidence DOUBLE PRECISION DEFAULT 1.0,
    direction_angle DOUBLE PRECISION DEFAULT 0.0,
    detection_range_meters DOUBLE PRECISION DEFAULT 4.0,
    purpose TEXT,
    health JSONB DEFAULT '{}'::jsonb,
    is_future_deployment BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 6. SENSOR READINGS TABLE (Physical prototype readings + time-series)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id TEXT REFERENCES sensors(id) ON DELETE CASCADE,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    device_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    distance_m DOUBLE PRECISION,
    accel_x DOUBLE PRECISION,
    accel_y DOUBLE PRECISION,
    accel_z DOUBLE PRECISION,
    gyro_x DOUBLE PRECISION,
    gyro_y DOUBLE PRECISION,
    gyro_z DOUBLE PRECISION,
    estimated_pitch DOUBLE PRECISION,
    estimated_roll DOUBLE PRECISION,
    approach_rate_mps DOUBLE PRECISION,
    confidence DOUBLE PRECISION DEFAULT 1.0,
    raw_packet TEXT,
    source TEXT NOT NULL CHECK (source IN ('HARDWARE', 'SIMULATION', 'DERIVED'))
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_time ON sensor_readings(sensor_id, timestamp DESC);

-- 7. VEHICLE TELEMETRY TABLE
-- Physical hardware mode: GPS, speed, fuel, engine temp, nearest vehicle are NULL
-- Simulation mode: Populated with realistic emulated operational fields
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed_kmh DOUBLE PRECISION,
    recommended_speed_kmh DOUBLE PRECISION,
    heading_degrees DOUBLE PRECISION,
    fuel_percent DOUBLE PRECISION,
    engine_temperature_c DOUBLE PRECISION,
    nearest_vehicle_id TEXT,
    nearest_vehicle_distance_m DOUBLE PRECISION,
    relative_speed_kmh DOUBLE PRECISION,
    estimated_pitch DOUBLE PRECISION,
    estimated_roll DOUBLE PRECISION,
    risk_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    risk_level TEXT NOT NULL DEFAULT 'SAFE' CHECK (risk_level IN ('SAFE', 'WARNING', 'HIGH_RISK', 'CRITICAL')),
    risk_factors JSONB DEFAULT '[]'::jsonb,
    recommended_action TEXT,
    source TEXT NOT NULL CHECK (source IN ('HARDWARE', 'SIMULATION', 'DERIVED'))
);

CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_veh_time ON vehicle_telemetry(vehicle_id, timestamp DESC);

-- 8. WEATHER READINGS TABLE (External API meteorological readings)
CREATE TABLE IF NOT EXISTS weather_readings (
    id BIGSERIAL PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperature_c DOUBLE PRECISION,
    humidity_percent DOUBLE PRECISION,
    wind_speed_kmh DOUBLE PRECISION,
    pressure_hpa DOUBLE PRECISION,
    visibility_m DOUBLE PRECISION,
    weather_condition TEXT NOT NULL DEFAULT 'CLEAR',
    source TEXT NOT NULL DEFAULT 'WEATHER_API' CHECK (source IN ('WEATHER_API', 'SIMULATION'))
);

CREATE INDEX IF NOT EXISTS idx_weather_site_time ON weather_readings(site_id, timestamp DESC);

-- 9. RISK PREDICTIONS TABLE
CREATE TABLE IF NOT EXISTS risk_predictions (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    risk_score DOUBLE PRECISION NOT NULL,
    risk_level TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    risk_factors JSONB DEFAULT '[]'::jsonb,
    recommended_action TEXT,
    model_version TEXT DEFAULT 'v1.0-rules',
    source TEXT NOT NULL DEFAULT 'DERIVED' CHECK (source IN ('DERIVED', 'ML'))
);

-- 10. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    sensor_id TEXT REFERENCES sensors(id) ON DELETE SET NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
    category TEXT NOT NULL CHECK (category IN ('COLLISION_RISK', 'VISIBILITY_HAZARD', 'OVERSPEED', 'PROXIMITY', 'SENSOR_FAILURE', 'ZONE_INTRUSION', 'ENVIRONMENTAL')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    current_value TEXT,
    risk_score_percent DOUBLE PRECISION DEFAULT 0.0,
    recommended_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by TEXT,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_site_status ON alerts(site_id, status);

-- 11. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
    incident_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'HIGH', 'CRITICAL')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED')),
    vehicle_ids JSONB DEFAULT '[]'::jsonb,
    zone_id TEXT REFERENCES zones(id) ON DELETE SET NULL,
    risk_score DOUBLE PRECISION DEFAULT 0.0,
    description TEXT NOT NULL,
    root_cause TEXT,
    preventative_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- =====================================================================
-- INITIAL SEED DATA
-- =====================================================================

INSERT INTO sites (id, organization_id, name, code, location, state, latitude, longitude, status)
VALUES 
    ('site-kirandul-01', 'org-nmdc-01', 'Kirandul Iron Ore Complex', 'NMDC-KRD-14', 'Bailadila Deposit 14, Dantewada', 'Chhattisgarh', 18.6312, 81.2485, 'CRITICAL'),
    ('site-bacheli-02', 'org-nmdc-01', 'Bacheli Complex Mine', 'NMDC-BCH-05', 'Bailadila Deposit 5, Bacheli', 'Chhattisgarh', 18.7124, 81.2842, 'OPERATIONAL')
ON CONFLICT (id) DO NOTHING;

INSERT INTO zones (id, site_id, name, code, polygon, max_speed, risk_level, is_restricted, description)
VALUES 
    ('zone-b4', 'site-kirandul-01', 'Pit Bench B-4 (Active Excavation)', 'PIT-B4', '[[18.6330, 81.2460], [18.6345, 81.2490], [18.6320, 81.2510], [18.6305, 81.2475]]'::jsonb, 15, 'HIGH', false, 'Deep pit slope with reduced visibility during early morning fog.'),
    ('zone-haul-ramp', 'site-kirandul-01', 'Main Haul Ramp #2 (Gradient 8%)', 'RAMP-H2', '[[18.6310, 81.2440], [18.6325, 81.2465], [18.6295, 81.2480], [18.6280, 81.2455]]'::jsonb, 20, 'MEDIUM', false, 'High volume dumper ramp connecting pit floor to primary crusher.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicles (id, site_id, zone_id, code, name, type, operator_id, operator_name, operator_phone, simulated, status)
VALUES 
    ('veh-d104', 'site-kirandul-01', 'zone-b4', 'D-104', 'CAT 777G Haul Dumper (100T)', 'DUMPER', 'usr-driver-104', 'Suresh Patel', '+91 98765 43210', false, 'CRITICAL'),
    ('veh-d108', 'site-kirandul-01', 'zone-b4', 'D-108', 'Komatsu HD785 Dumper', 'DUMPER', 'usr-driver-108', 'Ramesh Naidu', '+91 98765 43211', true, 'HIGH_RISK')
ON CONFLICT (id) DO NOTHING;

-- ACTUAL PHYSICAL HARDWARE PROTOTYPE SENSORS ONLY:
-- 1. HC-SR04 (Ultrasonic Distance)
-- 2. MPU6500 (6-Axis Accelerometer & Gyroscope)
INSERT INTO sensors (id, site_id, vehicle_id, zone_id, name, type, device_id, status, source, confidence, direction_angle, detection_range_meters, purpose, health, is_future_deployment)
VALUES 
    ('sns-hcsr04-01', 'site-kirandul-01', 'veh-d104', 'zone-b4', 'HC-SR04 Ultrasonic Distance Sensor', 'HC_SR04', 'ESP32-NODE-01', 'ONLINE', 'HARDWARE', 0.95, 0, 4.0, 'Prototype forward obstacle distance measurement via pulse echo.', '{"signalStrengthDbm": -55, "isCalibrated": true}'::jsonb, false),
    ('sns-mpu6500-01', 'site-kirandul-01', 'veh-d104', 'zone-b4', 'MPU6500 6-Axis Motion Sensor', 'MPU6500', 'ESP32-NODE-01', 'ONLINE', 'HARDWARE', 0.98, 0, 0.0, 'Prototype 3-axis accelerometer and 3-axis gyroscope motion sensing.', '{"isCalibrated": true}'::jsonb, false)
ON CONFLICT (id) DO NOTHING;
