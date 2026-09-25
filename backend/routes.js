import express from 'express';
import { db } from './database.js';
import { weatherService } from './weather.js';
import { hardwareConnector } from './hardware.js';
import { alertManager } from './alerts.js';
import { riskEngine } from './risk.js';
import { config } from './config.js';

export const router = express.Router();

// --- 1. HEALTH & DIAGNOSTICS ---
router.get('/health', (req, res) => {
  const mlEnabled = config.mlService.enabled;

  const supabaseStatus = db.isConnected ? 'ONLINE' : 'FALLBACK_READY';
  const hardwareStatus = hardwareConnector.isConnected ? 'CONNECTED' : 'DISCONNECTED';
  const weatherStatus = weatherService.currentWeather.isStale ? 'STALE' : 'LIVE';
  const mlStatus = mlEnabled ? 'ENABLED' : 'DISABLED';
  const overallStatus = weatherStatus === 'STALE' ? 'DEGRADED' : 'HEALTHY';

  res.json({
    status: overallStatus,
    system: '3rd Vision Edge Gateway',
    version: '2.5.0',
    mode: config.mode,
    operationMode: config.mode,
    timestamp: new Date().toISOString(),
    services: {
      database: supabaseStatus,
      supabase: supabaseStatus,
      hardware: hardwareStatus,
      weather: weatherStatus,
      ml: mlStatus,
      mlServiceUrl: mlEnabled ? config.mlService.url : null,
      realtime: 'ACTIVE',
    },
    hardware: {
      enabled: config.hardwareEnabled,
      connected: hardwareConnector.isConnected,
      port: hardwareConnector.activePortName || null,
      packetCount: hardwareConnector.packetCount || 0,
    },
  });
});

// --- 2. AUTHENTICATION (Firebase Token Verification & Demo Bypass) ---
router.post('/auth/verify-token', async (req, res) => {
  try {
    const { idToken, preferredRole } = req.body;
    const role = preferredRole || 'SITE_ADMIN';

    // Verify token with Firebase Admin if credentials are provided in the future,
    // or provide structured authenticated user profile compatible with frontend AuthState.
    const mockProfiles = {
      SUPER_ADMIN: {
        id: 'usr-super-01',
        email: 'admin.platform@3rdvision.gov.in',
        displayName: 'Vikramaditya Sharma',
        role: 'SUPER_ADMIN',
        organizationId: 'org-platform-00',
        organizationName: 'Ministry of Mines & Central Intelligence',
        assignedSiteIds: ['site-kirandul-01', 'site-bacheli-02'],
        permissions: ['*'],
      },
      SITE_ADMIN: {
        id: 'usr-site-01',
        email: 'site.admin@nmdc.co.in',
        displayName: 'Rajesh Kumar Verma',
        role: 'SITE_ADMIN',
        organizationId: 'org-nmdc-01',
        organizationName: 'NMDC Limited',
        assignedSiteIds: ['site-kirandul-01', 'site-bacheli-02'],
        permissions: ['site:manage', 'vehicles:manage', 'sensors:manage', 'alerts:manage'],
      },
      CONTROL_ROOM_OPERATOR: {
        id: 'usr-control-01',
        email: 'control.room@kirandul.nmdc.co.in',
        displayName: 'Priya Sundaram',
        role: 'CONTROL_ROOM_OPERATOR',
        organizationId: 'org-nmdc-01',
        organizationName: 'NMDC Kirandul Operations',
        assignedSiteIds: ['site-kirandul-01'],
        permissions: ['control:monitor', 'alerts:acknowledge', 'alerts:escalate', 'zones:restrict'],
      },
      VEHICLE_OPERATOR: {
        id: 'usr-driver-104',
        email: 'operator.d104@kirandul.nmdc.co.in',
        displayName: 'Suresh Patel (Operator D-104)',
        role: 'VEHICLE_OPERATOR',
        organizationId: 'org-nmdc-01',
        organizationName: 'Kirandul Mining Fleet',
        assignedSiteIds: ['site-kirandul-01'],
        assignedVehicleId: 'veh-d104',
        permissions: ['vehicle:read', 'alerts:ack_driver'],
      },
      MANAGEMENT: {
        id: 'usr-mgmt-01',
        email: 'gm.operations@nmdc.co.in',
        displayName: 'Dr. Ananya Roy',
        role: 'MANAGEMENT',
        organizationId: 'org-nmdc-01',
        organizationName: 'NMDC Executive Board',
        assignedSiteIds: ['site-kirandul-01', 'site-bacheli-02'],
        permissions: ['analytics:view', 'reports:export', 'management:overview'],
      },
    };

    const selectedUser = mockProfiles[role] || mockProfiles.SITE_ADMIN;

    res.json({
      user: selectedUser,
      role: selectedUser.role,
      permissions: selectedUser.permissions,
      assignedSites: selectedUser.assignedSiteIds,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. MINING SITES & ZONES ---
router.get('/sites', async (req, res) => {
  const sites = await db.getSites();
  res.json(sites);
});

router.get('/sites/:siteId', async (req, res) => {
  const site = await db.getSiteById(req.params.siteId);
  res.json(site);
});

router.get('/sites/:siteId/zones', async (req, res) => {
  const zones = await db.getZones(req.params.siteId);
  res.json(zones);
});

// --- 4. VEHICLES & TELEMETRY ---
router.get('/sites/:siteId/vehicles', async (req, res) => {
  const vehicles = await db.getVehicles(req.params.siteId);
  res.json(vehicles);
});

router.get('/vehicles/:vehicleId', async (req, res) => {
  const vehicle = await db.getVehicleById(req.params.vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

// --- 5. SENSORS ---
router.get('/sites/:siteId/sensors', async (req, res) => {
  const sensors = await db.getSensors(req.params.siteId);
  res.json(sensors);
});

// --- 6. WEATHER ---
router.get('/sites/:siteId/weather', async (req, res) => {
  const weather = await weatherService.fetchWeather();
  res.json(weather);
});

// --- 7. ALERTS ---
router.get('/sites/:siteId/alerts', async (req, res) => {
  const alerts = await db.getAlerts(req.params.siteId);
  res.json(alerts);
});

router.post('/alerts/:id/acknowledge', async (req, res) => {
  const { acknowledgedBy = 'Operator' } = req.body;
  const alert = await alertManager.acknowledgeAlert(req.params.id, acknowledgedBy);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
});

router.post('/alerts/:id/resolve', async (req, res) => {
  const alert = await alertManager.resolveAlert(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
});

// --- 8. INCIDENTS ---
router.get('/sites/:siteId/incidents', async (req, res) => {
  const incidents = await db.getIncidents(req.params.siteId);
  res.json(incidents);
});

router.post('/sites/:siteId/incidents', async (req, res) => {
  const newIncident = {
    id: `inc-${Date.now()}`,
    siteId: req.params.siteId,
    incidentNumber: `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
    title: req.body.title || 'Safety Near-Miss Event',
    severity: req.body.severity || 'WARNING',
    status: 'INVESTIGATING',
    vehicleIds: req.body.vehicleIds || ['veh-d104'],
    vehicleCodes: req.body.vehicleCodes || ['D-104'],
    zoneId: req.body.zoneId || 'zone-b4',
    zoneName: req.body.zoneName || 'Pit Bench B-4',
    riskScore: req.body.riskScore || 75,
    description: req.body.description || 'Proximity limit breached under dense fog.',
    rootCause: req.body.rootCause,
    preventativeAction: req.body.preventativeAction,
    createdAt: new Date().toISOString(),
  };

  const saved = await db.saveIncident(newIncident);
  res.status(201).json(saved);
});

// --- 9. MANAGEMENT ANALYTICS ---
router.get('/sites/:siteId/analytics', async (req, res) => {
  const analytics = db.getAnalytics(req.params.siteId);
  res.json(analytics);
});


// --- 11. HARDWARE (ESP32 RECEIVER/GATEWAY) ---
// The backend serial connection is to ESP32 #2 (RECEIVER/GATEWAY) ONLY.
// ESP32 #1 (SENSOR_NODE: MPU6500 + HC-SR04) is never USB-connected to the laptop.
// Data path: SENSOR_NODE → ESP-NOW → RECEIVER/GATEWAY → USB Serial → backend
//
// GET /hardware/status — returns ESP32_RECEIVER connection state + topology metadata
// GET /hardware/ports  — lists available COM ports (Bluetooth virtual ports filtered out)
// GET /hardware/raw    — last 50 raw packets forwarded by the receiver from the sensor node
router.get('/hardware/status', (req, res) => {
  res.json(hardwareConnector.getStatus());
});

router.get('/hardware/ports', async (req, res) => {
  const ports = await hardwareConnector.listAvailablePorts();
  res.json(ports);
});

router.get('/hardware/raw', (req, res) => {
  res.json(hardwareConnector.getRawPackets());
});

router.post('/hardware/connect', async (req, res) => {
  const { port } = req.body;
  const result = await hardwareConnector.connect(port);
  res.json(result);
});

router.post('/hardware/disconnect', async (req, res) => {
  await hardwareConnector.disconnect();
  res.json({ success: true, message: 'Disconnected' });
});

// --- 11b. HARDWARE NETWORK INGESTION ---
// Generic ingestion endpoint for any network-connected hardware equivalent.
// Accepts the same raw DATA packet format as the COM5 serial receiver.
// Both COM5 and this endpoint call hardwareConnector.handleIncomingLine().
//
// Use case: External Hardware-Equivalent Simulator, remote ESP32 bridge,
//           or any other hardware-equivalent packet source over HTTP.
//
// POST /api/hardware/ingest
// Body: { "rawPacket": "DATA,175,22.66,0.02,-0.07,0,1,-59,3",
//         "gatewayId": "ESP32_RX_SIM_01",    // optional transport metadata
//         "sensorNodeId": "ESP32_SENSOR_SIM_01" // optional transport metadata
//       }
router.post('/hardware/ingest', (req, res) => {
  const { rawPacket, gatewayId, sensorNodeId, deviceType, persist } = req.body || {};
  if (!rawPacket || typeof rawPacket !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'rawPacket string is required. Example: { "rawPacket": "DATA,175,22.66,0.02,-0.07,0,1,-59,3" }',
    });
  }

  // Generic persistence flag:
  // persist=false explicitly instructs backend that this telemetry is transient (skip DB writes).
  // Defaults to true for hardware or callers not specifying the flag.
  const shouldPersist = persist !== false;

  // Route through the same handleIncomingLine() used by the COM5 serial receiver.
  // Optional gateway/sensor IDs are transport metadata only — processing is identical.
  hardwareConnector.handleIncomingLine(rawPacket, {
    gatewayOverride: gatewayId || null,
    sensorOverride: sensorNodeId || null,
    deviceTypeOverride: deviceType || null,
    persist: shouldPersist,
  });

  res.json({
    success: true,
    packetCount: hardwareConnector.packetCount,
    rawPacket,
    persist: shouldPersist,
  });
});

// --- 12. RISK & ML PREDICTION PROXY ---
router.post('/predict', async (req, res) => {
  const assessment = await riskEngine.evaluateRisk(req.body);
  res.json(assessment);
});
