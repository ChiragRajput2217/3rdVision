import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';

import { config } from './config.js';
import { db } from './database.js';
import { router } from './routes.js';
import { weatherService } from './weather.js';
import { hardwareConnector } from './hardware.js';
import { riskEngine } from './risk.js';
import { alertManager } from './alerts.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configured from environment (CORS_ORIGINS in .env)
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins.length === 1 && config.corsOrigins[0] === '*'
      ? '*'
      : config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Attach Socket.IO to alert manager for real-time broadcasts
alertManager.setSocketIO(io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  // Use environment-configured origins (CORS_ORIGINS in .env).
  // The /api/hardware/ingest endpoint is server-to-server (simulator → backend)
  // so browser CORS does not apply to it; this config only affects browser clients.
  origin: config.corsOrigins,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register REST Routes
app.use('/api', router);
app.use('/', router); // Also serve directly at root for convenience (e.g. /health)

// --- UNIFIED TELEMETRY & PROCESSING PIPELINE ---
/**
 * Single pipeline function handling telemetry from BOTH Live Hardware AND Simulation.
 */
async function processUnifiedTelemetry(data) {
  try {
    const weather = weatherService.getCondition();
    const vehicles = await db.getVehicles();
    const targetVehicle = vehicles.find((v) => v.code === 'D-104') || vehicles[0];

    if (!targetVehicle) return;

    let distanceM = null;
    let approachRateMps = 0;
    let pitch = 0;
    let roll = 0;
    let currentSpeed = targetVehicle.telemetry?.speedKmh || 16;
    let source = 'SIMULATION';

    if (data.type === 'SIMULATION_TICK') {
      const telem = data.telemetry;
      distanceM = telem.nearestVehicleDistanceMeters;
      approachRateMps = (telem.relativeSpeedKmh || 0) / 3.6;
      pitch = telem.pitch;
      roll = telem.roll;
      currentSpeed = telem.speedKmh;
      source = 'SIMULATION';
    } else {
      // Live Hardware packet from ESP32 or external Hardware Simulator
      distanceM = data.raw.distanceM;
      approachRateMps = data.derived.approachRateMps;
      pitch = data.derived.pitch;
      roll = data.derived.roll;
      source = data.source || 'HARDWARE';
    }

    // 1. Evaluate Risk (Deterministic Safety Rules + Optional ML)
    const riskAssessment = await riskEngine.evaluateRisk({
      vehicleId: targetVehicle.id,
      distanceMeters: distanceM,
      approachRateMps,
      pitch,
      roll,
      accelMagnitude: data.derived?.accelMagnitude || 0,
      gyroMagnitude: data.derived?.gyroMagnitude || 0,
      tiltMagnitude: parseFloat(Math.sqrt((pitch || 0) ** 2 + (roll || 0) ** 2).toFixed(1)),
      speedKmh: currentSpeed,
      zoneSpeedLimit: 20,
      visibilityMeters: weather.visibilityMeters,
      fogLevelPercent: weather.fogLevelPercent,
      humidityPercent: weather.humidityPercent,
    });

    // 2. Update Vehicle Telemetry State
    targetVehicle.status = riskAssessment.riskLevel;
    targetVehicle.telemetry = {
      ...targetVehicle.telemetry,
      nearestVehicleDistanceMeters: distanceM !== null ? distanceM : targetVehicle.telemetry.nearestVehicleDistanceMeters,
      speedKmh: currentSpeed,
      recommendedSpeedKmh: riskAssessment.recommendedSpeedKmh,
      riskScorePercent: riskAssessment.riskScore,
      riskLevel: riskAssessment.riskLevel,
      riskFactors: riskAssessment.riskFactors,
      recommendedAction: riskAssessment.recommendedAction,
      pitch,
      roll,
      lastUpdate: new Date().toISOString(),
      source,
    };

    // 3. Process Alerts through Alert Manager (transient or persistent based on shouldPersist)
    const shouldPersist = data.persist !== false;
    await alertManager.processRiskAssessment(targetVehicle, riskAssessment, { persist: shouldPersist });

    // 4. Update Connected Sensor State (HC-SR04 Ultrasonic Distance)
    const sensors = await db.getSensors();
    const hcsr04 = sensors.find((s) => s.id === 'sns-hcsr04-01');
    if (hcsr04) {
      hcsr04.lastUpdate = new Date().toISOString();
      hcsr04.confidence = distanceM !== null && distanceM > 0.02 && distanceM < 4.0 ? 0.95 : 0.6;
      hcsr04.telemetry = {
        distanceMeters: distanceM,
        approachRateMps: approachRateMps,
        objectDetected: distanceM !== null && distanceM < 4.0,
        source,
      };
      // Emit sensor:update to Socket.IO clients
      io.emit('sensor:update', hcsr04);
    }

    // 5. Broadcast Real-time Events to Frontend
    io.emit('vehicle:update', targetVehicle);
    io.emit('risk:update', {
      vehicleId: targetVehicle.id,
      riskScore: riskAssessment.riskScore,
      recommendedSpeed: riskAssessment.recommendedSpeedKmh,
      riskLevel: riskAssessment.riskLevel,
      riskFactors: riskAssessment.riskFactors,
    });

    // 6. Log Telemetry to Cloud Database (non-blocking) — only if shouldPersist is true
    if (shouldPersist) {
      db.logVehicleTelemetry({
        vehicleId: targetVehicle.id,
        latitude: targetVehicle.telemetry.latitude,
        longitude: targetVehicle.telemetry.longitude,
        speedKmh: currentSpeed,
        recommendedSpeedKmh: riskAssessment.recommendedSpeedKmh,
        heading: targetVehicle.telemetry.heading,
        fuelLevelPercent: targetVehicle.telemetry.fuelLevelPercent,
        engineTempCelsius: targetVehicle.telemetry.engineTempCelsius,
        nearestVehicleId: targetVehicle.telemetry.nearestVehicleId,
        nearestVehicleDistanceMeters: distanceM,
        relativeSpeedKmh: Math.round(approachRateMps * 3.6),
        pitch,
        roll,
        estimatedPitch: pitch,   // schema alias: vehicle_telemetry.estimated_pitch
        estimatedRoll: roll,     // schema alias: vehicle_telemetry.estimated_roll
        riskScorePercent: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        riskFactors: riskAssessment.riskFactors,
        recommendedAction: riskAssessment.recommendedAction,
        source,
      });
    }
  } catch (err) {
    console.warn('⚠️ Telemetry processing error:', err.message);
  }
}

// Hook Unified Processing Pipeline to Hardware and Simulator
hardwareConnector.setTelemetryCallback((hwData) => processUnifiedTelemetry(hwData));

// --- REALTIME SOCKET.IO EVENT HANDLING ---
io.on('connection', (socket) => {
  console.log('⚡ Client connected to 3rd Vision Socket.IO stream:', socket.id);

  // Send initial hardware/gateway topology state to the newly connected client.
  const hwStatus = hardwareConnector.getStatus();
  socket.emit('device:status', {
    id: hwStatus.gatewayId,
    deviceType: hwStatus.deviceType,
    sensorNodeId: hwStatus.sensorNodeId,
    status: hwStatus.connected ? 'ONLINE' : hwStatus.connectionState === 'NETWORK_INGEST' ? 'ONLINE' : 'DISCONNECTED',
    source: 'HARDWARE',
  });

  // Client subscribes to a specific mine site room
  socket.on('subscribe:site', (siteId) => {
    socket.join(`site:${siteId}`);
    console.log(`📡 Socket ${socket.id} joined room: site:${siteId}`);
  });

  // Alert acknowledgement from UI
  socket.on('alert:acknowledge', async (data) => {
    const { alertId, acknowledgedBy = 'Operator' } = data || {};
    if (alertId) {
      const updated = await alertManager.acknowledgeAlert(alertId, acknowledgedBy);
      if (updated) {
        io.emit('alert:updated', updated);
      }
    }
  });

  // Alert resolution
  socket.on('alert:resolve', async (data) => {
    const { alertId } = data || {};
    if (alertId) {
      const updated = await alertManager.resolveAlert(alertId);
      if (updated) {
        io.emit('alert:updated', updated);
      }
    }
  });

  // Dynamic speed advisory adjustment from in-cab interface
  socket.on('vehicle:speed_update', async (data) => {
    const { vehicleId, speedKmh } = data || {};
    const vehicle = await db.getVehicleById(vehicleId);
    if (vehicle) {
      vehicle.telemetry.speedKmh = speedKmh;
      io.emit('vehicle:update', vehicle);
    }
  });


  socket.on('disconnect', (reason) => {
    console.log(`⚠️ Client disconnected (${socket.id}):`, reason);
  });
});

// --- SUBSYSTEM INITIALIZATION ---
async function startServer() {
  const PORT = config.port;

  server.listen(PORT, async () => {
    console.log('\n============================================================');
    console.log('      3RD VISION EDGE GATEWAY & BACKEND SERVER ACTIVE       ');
    console.log('  SIH Problem 26007: Low-Visibility Mining Vehicle Safety    ');
    console.log('============================================================');
    console.log(`🌐 HTTP & REST API:   http://localhost:${PORT}/api`);
    console.log(`⚡ Socket.IO Stream:  http://localhost:${PORT}`);
    console.log(`☁️ Cloud Database:    ${config.supabase.url ? config.supabase.url : 'Supabase Cloud-Ready (Bootstrap Seeded)'}`);
    console.log(`⛅ Weather Polling:   Active for Bailadila Deposit 14 (18.6312, 81.2485)`);
    console.log('------------------------------------------------------------');
    console.log('🔗 Hardware Topology:');
    console.log(`   SENSOR_NODE  (${config.serial.sensorNodeId}): MPU6500 + HC-SR04 → ESP-NOW`);
    console.log(`   RECEIVER/GW  (${config.serial.gatewayId}): USB Serial → backend`);
    console.log(`   Serial port config: ${config.serial.portName || 'auto-detect'} @ ${config.serial.baudRate} baud`);
    console.log('============================================================\n');

    // 1. Start weather polling
    weatherService.startPolling();

    // 2. Initialize hardware serial connector
    if (config.hardwareEnabled) {
      await hardwareConnector.connect();
    }


  });
}

// Graceful Shutdown
async function handleShutdown() {
  console.log('\n🛑 Initiating graceful shutdown of 3rd Vision backend...');
  weatherService.stopPolling();
  await hardwareConnector.disconnect();
  server.close(() => {
    console.log(' Server terminated gracefully.');
    process.exit(0);
  });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

startServer();
