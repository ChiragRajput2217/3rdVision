import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  env: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173').split(','),

  // Operational Mode
  mode: process.env.OPERATION_MODE || (process.argv.includes('--mode=hardware') ? 'HARDWARE' : 'SIMULATION'),
  simulationEnabled: process.env.SIMULATION_ENABLED !== 'false',
  hardwareEnabled: process.env.HARDWARE_ENABLED !== 'false',

  // Cloud Database (Supabase)
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // ESP32 Receiver/Gateway Serial Port
  // The backend ONLY connects to ESP32 #2 (the RECEIVER/GATEWAY) over USB Serial.
  // ESP32 #1 (SENSOR_NODE) communicates with the receiver wirelessly via ESP-NOW
  // and is NEVER directly connected to the laptop.
  serial: {
    portName: process.env.SERIAL_PORT || '',         // Empty = auto-detect Windows COM port
    baudRate: parseInt(process.env.SERIAL_BAUD_RATE || '115200', 10),
    autoReconnect: process.env.SERIAL_AUTO_RECONNECT !== 'false',
    reconnectIntervalMs: parseInt(process.env.SERIAL_RECONNECT_INTERVAL_MS || '5000', 10),
    // Logical device identifiers for the two-node topology
    gatewayId: process.env.GATEWAY_ID || 'ESP32_RX_01',           // ESP32 #2 — USB-connected receiver
    sensorNodeId: process.env.SENSOR_NODE_ID || 'ESP32_SENSOR_01', // ESP32 #1 — wireless sensor node
  },

  // Weather API (Open-Meteo for Bailadila Deposit 14 / Kirandul)
  weather: {
    latitude: parseFloat(process.env.MINE_LATITUDE || '18.6312'),
    longitude: parseFloat(process.env.MINE_LONGITUDE || '81.2485'),
    updateIntervalMs: parseInt(process.env.WEATHER_UPDATE_INTERVAL_MS || '600000', 10), // 10 minutes
    cacheTtlMs: parseInt(process.env.WEATHER_CACHE_TTL_MS || '900000', 10), // 15 minutes
  },

  // ML Service
  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:8000/predict',
    timeoutMs: parseInt(process.env.ML_TIMEOUT_MS || '800', 10),
    enabled: process.env.ML_ENABLED !== 'false',
  },

  // Default Mining Site
  defaultSiteId: process.env.DEFAULT_SITE_ID || 'site-kirandul-01',
  defaultVehicleId: process.env.DEFAULT_VEHICLE_ID || 'veh-d104',
};
