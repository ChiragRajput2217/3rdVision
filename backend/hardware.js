/**
 * hardware.js — MineSafe ESP32 Receiver/Gateway Serial Connector
 *
 * ============================================================
 * TWO-NODE HARDWARE TOPOLOGY
 * ============================================================
 *
 *  ESP32 #1  ─ SENSOR_NODE (ID: ESP32_SENSOR_01)
 *    Physical sensors attached: MPU6500 (IMU), HC-SR04 (ultrasonic distance),
 *    Servo, Buzzer, Warning LED, 9-segment LED bar.
 *    Role: reads sensors, performs local hardware behavior (buzzer, servo, LED),
 *    transmits telemetry wirelessly via ESP-NOW.
 *    USB connection: NONE — this ESP32 is NEVER connected to the laptop.
 *
 *  ESP32 #2  ─ RECEIVER / GATEWAY (ID: ESP32_RX_01)
 *    Role: receives ESP-NOW packets from the SENSOR_NODE, then forwards the
 *    raw telemetry payload over USB Serial to this Node.js process.
 *    USB connection: YES — this is the ONLY ESP32 connected to the Windows laptop.
 *
 * DATA PATH:
 *   ESP32 SENSOR_NODE
 *       ↓  ESP-NOW (wireless)
 *   ESP32 RECEIVER/GATEWAY
 *       ↓  USB Serial (COMx)
 *   hardware.js (this file)
 *       ↓  Stage 1: decodeRawPacket()  → { packetType, fields[] }
 *       ↓  Stage 2: mapSemantics()     → { distanceCm, accelX, ... }
 *       ↓  Stage 3: normaliseAndDerive() → latestState.raw / .derived
 *   Unified MineSafe telemetry pipeline
 *
 * The backend DOES NOT communicate with the SENSOR_NODE directly.
 * The backend DOES NOT claim the receiver itself contains MPU6500 or HC-SR04.
 * Those sensors are physically located on the SENSOR_NODE.
 *
 * Device identifiers are sourced from config.serial (→ .env) so they are
 * never duplicated as literals inside this file.
 *
 * ============================================================
 * REAL PACKET FORMAT (observed on COM5, firmware NOT available in repository)
 * ============================================================
 *
 *   DATA,F1,F2,F3,F4,F5,F6,F7,F8
 *
 *   Examples:
 *     DATA,165,18.76,0.36,0.44,0,0,-127,1
 *     DATA,170,18.74,0.31,0.20,0,0,-127,1
 *     DATA,175,17.80,0.30,0.14,0,0,-127,1
 *
 *   CONFIRMED fields (structural analysis of observed packets):
 *     F1 (fields[0]): 165/170/175 — Packet sequence counter (int, +5/pkt)
 *     F2 (fields[1]): 18.76/18.74/17.80 — HC-SR04 distance (cm)
 *
 *   INFERRED fields (firmware source NOT available; do not treat as ground truth):
 *     F3 (fields[2]): 0.36/0.31/0.30 — likely MPU6500 accelX (g)
 *     F4 (fields[3]): 0.44/0.20/0.14 — likely MPU6500 accelY (g)
 *     F5 (fields[4]): 0              — likely MPU6500 accelZ (g) — always 0, likely not transmitted
 *     F6 (fields[5]): 0              — likely gyroX — always 0
 *     F7 (fields[6]): -127           — likely ESP-NOW RSSI (dBm, -127 = no signal sentinel)
 *     F8 (fields[7]): 1              — likely validFlag (1 = data valid)
 *
 *   NOTE: accelZ = 0 is NOT a valid gravity reading. MPU6500 at rest reads ~9.8 m/s².
 *   Pitch/roll calculations REQUIRE valid accelZ and are SUPPRESSED when az < 1.0 g.
 *   Update mapSemantics() when the firmware source (.ino) becomes available.
 * ============================================================
 */

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { config } from './config.js';
import { db } from './database.js';

class HardwareConnector {
  constructor() {
    // Pull topology identifiers from centralised config (reads .env)
    this.gatewayId = config.serial.gatewayId;       // ESP32 #2 — the USB-connected receiver
    this.sensorNodeId = config.serial.sensorNodeId; // ESP32 #1 — the wireless sensor node

    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.isStopping = false;
    this.activePortName = null;
    this.reconnectTimer = null;
    this.packetCount = 0;
    this.lastPacketTimestamp = null;
    this.lastError = null;

    // Ring buffer of last 50 raw packets for debugging & inspection
    // (packets originate from SENSOR_NODE but arrive via RECEIVER/GATEWAY)
    this.rawPacketBuffer = [];

    // Normalized latest hardware state
    this.latestState = {
      // ── Topology metadata ─────────────────────────────────────────────────
      source: 'HARDWARE',
      deviceType: 'ESP32_RECEIVER',  // The USB-connected device is the RECEIVER, not the sensor node
      gatewayId: this.gatewayId,
      sensorNodeId: this.sensorNodeId,
      // ── Serial connection state ───────────────────────────────────────────
      connected: false,
      port: null,
      baudRate: config.serial.baudRate,
      // ── Latest packet metadata ────────────────────────────────────────────
      rawPacket: null,
      timestamp: null,
      // ── Sensor readings (from SENSOR_NODE, forwarded by RECEIVER) ─────────
      // MPU6500 and HC-SR04 are physically on SENSOR_NODE (ESP32 #1).
      raw: {
        sequenceNumber: null, // Packet counter from RECEIVER firmware (confirmed)
        distanceCm: null,     // HC-SR04 distance in cm (confirmed)
        distanceM: null,      // derived from distanceCm
        accelX: null,         // MPU6500 X-axis (g) — INFERRED; firmware not available
        accelY: null,         // MPU6500 Y-axis (g) — INFERRED
        accelZ: null,         // MPU6500 Z-axis (g) — INFERRED; null when firmware reports 0
        gyroX: null,          // MPU6500 gyro X — INFERRED; always 0 in observed packets
        gyroY: null,
        gyroZ: null,
        rssiDbm: null,        // ESP-NOW RSSI (dBm) — INFERRED (-127 = no signal)
        validFlag: null,      // data-valid flag — INFERRED (1 = valid)
      },
      derived: {
        pitch: null,          // null when accelZ unavailable
        roll: null,           // null when accelZ unavailable
        approachRateMps: 0,
        distanceChangeM: 0,
        motionState: 'STATIONARY',
        accelMagnitude: null,
      },
      // Note: Fields not supported by actual hardware are explicitly null.
      // The receiver/sensor-node setup does NOT provide GPS, speed, fuel, or engine temperature.
      industrial: {
        gps: null,
        speedKmh: null,
        fuelPercent: null,
        engineTempC: null,
        headingDegrees: null,
      },
    };

    this.prevDistanceM = null;
    this.prevDistanceTime = null;
    this.telemetryCallback = null;
  }

  setTelemetryCallback(cb) {
    this.telemetryCallback = cb;
  }

  // ---------------------------------------------------------------------------
  // PORT ENUMERATION
  // ---------------------------------------------------------------------------

  async listAvailablePorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map((p) => ({
        path: p.path,
        manufacturer: p.manufacturer || 'Unknown',
        serialNumber: p.serialNumber || 'N/A',
        pnpId: p.pnpId || 'N/A',
      }));
    } catch (err) {
      console.warn('⚠️ Failed to list serial ports:', err.message);
      return [];
    }
  }

  async autoDetectPort() {
    const ports = await this.listAvailablePorts();
    if (ports.length === 0) return null;

    // Exclude Bluetooth virtual COM ports — they appear as Microsoft-manufactured
    // ports with BTHENUM in their pnpId. These are NOT ESP32 USB-serial devices.
    // The RECEIVER/GATEWAY ESP32 connects via a physical USB-UART bridge (CP210x / CH340 / FTDI).
    const physicalPorts = ports.filter((p) => {
      const isBluetooth =
        /BTHENUM/i.test(p.pnpId || '') ||
        (/Microsoft/i.test(p.manufacturer || '') && !/Serial/i.test(p.manufacturer || ''));
      return !isBluetooth;
    });

    const searchPorts = physicalPorts.length > 0 ? physicalPorts : ports;

    // Prefer USB-Serial controllers commonly used in ESP32 receiver boards (CP210x, CH340, FTDI)
    const espMatch = searchPorts.find(
      (p) =>
        /cp210|ch340|ftdi|usb|serial|esp32/i.test(p.manufacturer) ||
        /cp210|ch340|ftdi|usb|serial/i.test(p.pnpId)
    );

    if (espMatch) return espMatch.path;

    // Fallback: Pick highest COM port number from physical-only ports
    const comPorts = searchPorts.filter((p) => /^COM\d+/i.test(p.path));
    if (comPorts.length > 0) {
      comPorts.sort((a, b) => {
        const numA = parseInt(a.path.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.path.replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      });
      return comPorts[0].path;
    }

    return physicalPorts[0]?.path || null;
  }

  // ---------------------------------------------------------------------------
  // CONNECTION MANAGEMENT
  // ---------------------------------------------------------------------------

  async connect(targetPortName = null) {
    if (!config.hardwareEnabled) {
      return { success: false, message: 'Hardware connection disabled by configuration (HARDWARE_ENABLED=false)' };
    }
    if (this.isStopping) {
      console.log('[HARDWARE] Ignoring connect attempt because shutdown is active');
      return { success: false, message: 'Shutdown is active' };
    }
    if (this.isConnecting) return { success: false, message: 'Already connecting' };
    
    if (this.isConnected && this.port && this.port.isOpen) {
      if (!targetPortName || targetPortName === this.activePortName) {
        return { success: true, message: `Already connected to ${this.activePortName}` };
      }
      await this.disconnect();
    }

    this.isConnecting = true;
    console.log('[HARDWARE] Starting connection manager');

    const portToUse = targetPortName || config.serial.portName || (await this.autoDetectPort());

    if (!portToUse) {
      console.log(
        'ℹ️  No ESP32 Receiver/Gateway detected on any serial/COM port. Running in simulation mode.\n' +
        '    (Ensure the RECEIVER ESP32 is connected via USB — not the sensor-node ESP32.)'
      );
      this.scheduleReconnect();
      return { success: false, message: 'No serial port found — ESP32 Receiver/Gateway not detected' };
    }

    try {
      console.log(
        `🔌 Connecting to ESP32 Receiver/Gateway (${this.gatewayId}) on ${portToUse} at ${config.serial.baudRate} baud...\n` +
        `   (Telemetry originates from SENSOR_NODE ${this.sensorNodeId} via ESP-NOW → forwarded by gateway over USB)`
      );

      this.port = new SerialPort({
        path: portToUse,
        baudRate: config.serial.baudRate,
        autoOpen: false,
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.port.open((err) => {
        if (err) {
          console.warn(`⚠️ Failed to open serial port ${portToUse}: ${err.message}`);
          this.lastError = err.message;
          this.isConnecting = false;
          this.isConnected = false;
          this.scheduleReconnect();
          return;
        }

        this.isConnecting = false;
        this.isConnected = true;
        this.activePortName = portToUse;
        this.latestState.connected = true;
        this.latestState.port = portToUse;
        console.log(`[HARDWARE] Connected ${portToUse}`);
      });

      this.parser.on('data', (line) => this.handleIncomingLine(line));

      this.port.on('close', () => {
        if (!this.isStopping) {
          console.log(`[HARDWARE] Connection lost`);
          this.cleanup();
          this.scheduleReconnect();
        }
      });

      this.port.on('error', (err) => {
        if (!this.isStopping) {
          console.warn(`⚠️ Serial port error on ${portToUse}: ${err.message}`);
          this.lastError = err.message;
          this.cleanup();
          this.scheduleReconnect();
        }
      });

      return { success: true, port: portToUse };
    } catch (err) {
      console.warn(`⚠️ Exception establishing serial connection on ${portToUse}:`, err.message);
      this.lastError = err.message;
      this.isConnecting = false;
      this.cleanup();
      this.scheduleReconnect();
      return { success: false, error: err.message };
    }
  }

  async disconnect() {
    console.log('[HARDWARE] Shutdown requested');
    this.isStopping = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      console.log('[HARDWARE] Reconnect timer cancelled');
    }

    if (this.port && this.port.isOpen) {
      console.log('[HARDWARE] Closing serial port');
      await new Promise((resolve) => this.port.close(resolve));
      console.log('[HARDWARE] Serial port closed');
    }
    this.cleanup();
    console.log('[HARDWARE] Hardware manager stopped');
  }

  cleanup() {
    this.isConnected = false;
    this.latestState.connected = false;
    this.port = null;
    this.parser = null;
  }

  scheduleReconnect() {
    if (this.isStopping || !config.hardwareEnabled) return;
    if (!config.serial.autoReconnect || this.reconnectTimer) return;
    console.log(`[HARDWARE] Scheduling reconnect in ${config.serial.reconnectIntervalMs}ms`);
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.isConnected && !this.isStopping) {
        console.log(`[HARDWARE] Attempting auto-reconnect...`);
        await this.connect();
      }
    }, config.serial.reconnectIntervalMs);
  }

  // ---------------------------------------------------------------------------
  // STAGE 1 — RAW PACKET DECODER
  //
  // Converts a raw serial line into a structured { packetType, fields[] } object.
  // Does NOT assign any sensor-semantic meaning to field positions.
  //
  // Priority order:
  //   A. DATA prefix CSV  — "DATA,165,18.76,..." (real ESP32_RX_01 firmware format)
  //   B. JSON             — {"dist":14.2,...}
  //   C. Key-Value        — D:14.2,AX:0.1,...
  //   D. Numeric CSV      — 14.2,0.1,-0.2,...
  //   E. Single numeric   — 14.2
  // ---------------------------------------------------------------------------

  decodeRawPacket(rawStr) {
    // ── Format A: DATA prefix CSV (primary — real receiver firmware) ─────────
    if (rawStr.startsWith('DATA,')) {
      const tokens = rawStr.split(',');
      const rawFields = tokens.slice(1); // skip 'DATA'
      const fields = rawFields.map((t) => parseFloat(t.trim()));
      if (fields.length >= 2 && !isNaN(fields[0]) && !isNaN(fields[1])) {
        return { packetType: 'DATA', rawFields, fields };
      }
      return { packetType: 'DATA', rawFields, fields, malformed: true };
    }

    // ── Format B: JSON ──────────────────────────────────────────────────────
    if (rawStr.startsWith('{') && rawStr.endsWith('}')) {
      try {
        return { packetType: 'JSON', obj: JSON.parse(rawStr) };
      } catch (e) { /* fall through */ }
    }

    // ── Format C: Key-Value ─────────────────────────────────────────────────
    if (!rawStr.startsWith('{') && (rawStr.includes(':') || rawStr.includes('='))) {
      const obj = {};
      let hasAny = false;
      for (const pair of rawStr.split(/[,;\s]+/)) {
        const [k, v] = pair.split(/[:=]/);
        if (k && v !== undefined) {
          const num = parseFloat(v);
          if (!isNaN(num)) { obj[k.trim().toLowerCase()] = num; hasAny = true; }
        }
      }
      if (hasAny) return { packetType: 'KV', obj };
    }

    // ── Format D: Numeric CSV ───────────────────────────────────────────────
    if (rawStr.includes(',')) {
      const parts = rawStr.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length >= 1 && !isNaN(parts[0])) {
        return { packetType: 'CSV', fields: parts };
      }
    }

    // ── Format E: Single numeric ────────────────────────────────────────────
    const singleMatch = rawStr.match(/^([-+]?[0-9]*\.?[0-9]+)$/);
    if (singleMatch) {
      const val = parseFloat(singleMatch[1]);
      if (!isNaN(val)) return { packetType: 'SINGLE', fields: [val] };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // STAGE 2 — SEMANTIC MAPPING
  //
  // Assigns sensor meanings to decoded packet fields.
  // Returns a canonical object with named fields in physical units.
  //
  // For DATA packets the firmware (.ino) is NOT available in this repository.
  // The mapping for F1/F2 is confirmed by structural observation.
  // F3–F8 are INFERRED — update when firmware source is located.
  //
  // DATA field table:
  //   fields[0]: sequenceNumber   — CONFIRMED (integer, increments by 5)
  //   fields[1]: distanceCm       — CONFIRMED (float, HC-SR04 range 2-400 cm)
  //   fields[2]: accelX (g)       — INFERRED  (small float ~0.3)
  //   fields[3]: accelY (g)       — INFERRED  (small float ~0.2)
  //   fields[4]: accelZ (g)       — INFERRED  (always 0 → not transmitted by firmware)
  //   fields[5]: gyroX (deg/s)    — INFERRED  (always 0)
  //   fields[6]: rssiDbm (dBm)    — INFERRED  (constant -127 = ESP-NOW no-signal sentinel)
  //   fields[7]: validFlag        — INFERRED  (constant 1 = data valid)
  // ---------------------------------------------------------------------------

  mapSemantics(decoded) {
    if (!decoded) return null;

    if (decoded.packetType === 'DATA') {
      if (decoded.malformed) return null;
      const f = decoded.fields;
      return {
        sequenceNumber: Math.round(f[0] ?? 0),
        distanceCm:     f[1] ?? null,
        accelX:         f[2] ?? null,  // INFERRED
        accelY:         f[3] ?? null,  // INFERRED
        accelZ:         f[4] ?? null,  // INFERRED — likely 0 / not transmitted
        gyroX:          f[5] ?? null,  // INFERRED
        gyroY:          null,
        gyroZ:          null,
        rssiDbm:        f[6] ?? null,  // INFERRED
        validFlag:      f[7] ?? null,  // INFERRED
        mappingConfidence: 'INFERRED', // update to CONFIRMED when firmware reviewed
      };
    }

    if (decoded.packetType === 'JSON') {
      const o = decoded.obj;
      const rawDist = o.dist ?? o.distance ?? o.d ?? o.distance_m ??
        (o.distance_cm != null ? o.distance_cm : null);
      const distanceCm = rawDist != null ? (rawDist > 50 ? rawDist : rawDist * 100) : null;
      return {
        sequenceNumber: null, distanceCm,
        accelX: o.ax ?? o.accel_x ?? null,
        accelY: o.ay ?? o.accel_y ?? null,
        accelZ: o.az ?? o.accel_z ?? null,
        gyroX:  o.gx ?? o.gyro_x ?? null,
        gyroY:  o.gy ?? o.gyro_y ?? null,
        gyroZ:  o.gz ?? o.gyro_z ?? null,
        rssiDbm: o.rssi ?? null, validFlag: null,
        mappingConfidence: 'CONFIRMED',
      };
    }

    if (decoded.packetType === 'KV') {
      const o = decoded.obj;
      const rawDist = o.dist ?? o.distance ?? o.d;
      const distanceCm = rawDist != null ? (rawDist > 50 ? rawDist : rawDist * 100) : null;
      return {
        sequenceNumber: null, distanceCm,
        accelX: o.ax ?? o.accel_x ?? null,
        accelY: o.ay ?? o.accel_y ?? null,
        accelZ: o.az ?? o.accel_z ?? null,
        gyroX:  o.gx ?? o.gyro_x ?? null,
        gyroY:  o.gy ?? o.gyro_y ?? null,
        gyroZ:  o.gz ?? o.gyro_z ?? null,
        rssiDbm: o.rssi ?? null, validFlag: null,
        mappingConfidence: 'CONFIRMED',
      };
    }

    if (decoded.packetType === 'CSV') {
      const f = decoded.fields;
      // Legacy assumed order: dist(cm>50 or m<50), ax, ay, az, gx, gy, gz
      const rawDist = f[0];
      return {
        sequenceNumber: null,
        distanceCm: rawDist > 50 ? rawDist : rawDist * 100,
        accelX: f[1] ?? null, accelY: f[2] ?? null, accelZ: f[3] ?? null,
        gyroX:  f[4] ?? null, gyroY:  f[5] ?? null, gyroZ:  f[6] ?? null,
        rssiDbm: null, validFlag: null,
        mappingConfidence: 'INFERRED',
      };
    }

    if (decoded.packetType === 'SINGLE') {
      const val = decoded.fields[0];
      return {
        sequenceNumber: null,
        distanceCm: val > 50 ? val : val * 100,
        accelX: null, accelY: null, accelZ: null,
        gyroX: null, gyroY: null, gyroZ: null,
        rssiDbm: null, validFlag: null,
        mappingConfidence: 'INFERRED',
      };
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // STAGE 3 — NORMALISE & DERIVE
  //
  // 1. distanceCm → distanceM
  // 2. approachRateMps via time-differentiation of distanceM
  // 3. pitch/roll — ONLY when accelZ >= 1.0 g (gravity present)
  //    When accelZ = 0 (firmware not transmitting), pitch/roll remain null.
  // 4. accelMagnitude → motionState
  //
  // Returns { distanceM, approachRateMps, pitch, roll, ax, ay, az, gx, gy, gz }
  // and updates this.latestState.raw / .derived in-place.
  // ---------------------------------------------------------------------------

  normaliseAndDerive(mapped) {
    const { sequenceNumber, distanceCm, accelX, accelY, accelZ,
            gyroX, gyroY, gyroZ, rssiDbm, validFlag } = mapped;

    // ── Distance ─────────────────────────────────────────────────────────────
    let distanceM = null;
    if (distanceCm !== null && !isNaN(distanceCm) && distanceCm > 0) {
      distanceM = parseFloat((distanceCm / 100).toFixed(3));
    }

    // ── Accelerometer ────────────────────────────────────────────────────────
    // accelZ = 0 means the firmware did not transmit it (not a valid gravity reading).
    // Suppress it so pitch/roll calculation is not corrupted.
    const ax = (accelX !== null && !isNaN(accelX)) ? accelX : null;
    const ay = (accelY !== null && !isNaN(accelY)) ? accelY : null;
    const az = (accelZ !== null && !isNaN(accelZ) && Math.abs(accelZ) >= 1.0) ? accelZ : null;
    const gx = (gyroX  !== null && !isNaN(gyroX))  ? gyroX  : null;
    const gy = (gyroY  !== null && !isNaN(gyroY))  ? gyroY  : null;
    const gz = (gyroZ  !== null && !isNaN(gyroZ))  ? gyroZ  : null;

    // ── Approach rate ─────────────────────────────────────────────────────────
    const nowMs = Date.now();
    let approachRateMps = 0;
    let distanceChangeM = 0;
    if (this.prevDistanceM !== null && distanceM !== null && this.prevDistanceTime) {
      const dtSec = Math.max(0.05, (nowMs - this.prevDistanceTime) / 1000);
      distanceChangeM = distanceM - this.prevDistanceM;
      approachRateMps = parseFloat(((this.prevDistanceM - distanceM) / dtSec).toFixed(3));
    }
    this.prevDistanceM = distanceM;
    this.prevDistanceTime = nowMs;

    // ── Pitch & Roll — requires valid accelZ (gravity component) ─────────────
    let pitch = null;
    let roll  = null;
    if (ax !== null && ay !== null && az !== null) {
      pitch = parseFloat(
        (Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI)).toFixed(1)
      );
      roll = parseFloat((Math.atan2(ay, az) * (180 / Math.PI)).toFixed(1));
    }

    // ── Motion state & Magnitudes ─────────────────────────────────────────────
    let accelMagnitude = null;
    let motionState = 'STATIONARY';
    if (ax !== null && ay !== null) {
      const azForMag = az !== null ? az : 9.8; // use gravity baseline when az unavailable
      accelMagnitude = parseFloat(
        Math.sqrt(ax * ax + ay * ay + (azForMag - 9.8) * (azForMag - 9.8)).toFixed(3)
      );
      motionState =
        accelMagnitude > 2.5 ? 'HIGH_VIBRATION' :
        accelMagnitude > 0.8 ? 'IN_MOTION' :
        'STATIONARY';
    }

    const gyroMagnitude = (gx !== null || gy !== null || gz !== null)
      ? parseFloat(Math.sqrt((gx || 0) ** 2 + (gy || 0) ** 2 + (gz || 0) ** 2).toFixed(3))
      : 0;

    const tiltMagnitude = (pitch !== null || roll !== null)
      ? parseFloat(Math.sqrt((pitch || 0) ** 2 + (roll || 0) ** 2).toFixed(1))
      : 0;

    // ── Write latestState ────────────────────────────────────────────────────
    this.latestState.raw = {
      sequenceNumber: sequenceNumber ?? null,
      distanceCm: distanceCm !== null ? parseFloat(distanceCm.toFixed(2)) : null,
      distanceM,
      accelX: ax !== null ? parseFloat(ax.toFixed(3)) : null,
      accelY: ay !== null ? parseFloat(ay.toFixed(3)) : null,
      accelZ: az !== null ? parseFloat(az.toFixed(3)) : null,
      gyroX:  gx !== null ? parseFloat(gx.toFixed(3)) : null,
      gyroY:  gy !== null ? parseFloat(gy.toFixed(3)) : null,
      gyroZ:  gz !== null ? parseFloat(gz.toFixed(3)) : null,
      rssiDbm: rssiDbm ?? null,
      validFlag: validFlag ?? null,
    };
    this.latestState.derived = {
      pitch,
      roll,
      approachRateMps,
      distanceChangeM: parseFloat(distanceChangeM.toFixed(3)),
      motionState,
      accelMagnitude,
      gyroMagnitude,
      tiltMagnitude,
    };

    return { distanceM, approachRateMps, pitch, roll, ax, ay, az, gx, gy, gz, accelMagnitude, gyroMagnitude, tiltMagnitude };
  }

  // ---------------------------------------------------------------------------
  // INCOMING LINE HANDLER
  //
  // Orchestrates the three-stage pipeline:
  //   raw line → decodeRawPacket → mapSemantics → normaliseAndDerive
  //   → telemetryCallback → db.logSensorReading
  // ---------------------------------------------------------------------------

  /**
   * Ingests a raw hardware packet line from any transport:
   *   - USB Serial (COM5 / real ESP32 receiver)
   *   - HTTP network ingestion (POST /api/hardware/ingest)
   *
   * Both transports call this same function — there is one pipeline.
   *
   * @param {string} line - Raw packet string, e.g. "DATA,175,22.66,0.02,-0.07,0,1,-59,3"
   * @param {object} overrides - Optional transport metadata (gatewayId, sensorNodeId, deviceType, sourceOverride, persist)
   */
  handleIncomingLine(line, {
    gatewayOverride = null,
    sensorOverride = null,
    deviceTypeOverride = null,
    sourceOverride = null,
    persist = true,
  } = {}) {
    const rawStr = line.trim();
    if (!rawStr) return;

    this.packetCount++;
    this.lastPacketTimestamp = new Date().toISOString();

    // Transport metadata & source semantics (HARDWARE vs SIMULATION)
    const effectiveGatewayId = gatewayOverride || this.gatewayId;
    const effectiveSensorNodeId = sensorOverride || this.sensorNodeId;
    const effectiveSource = sourceOverride || (persist ? 'HARDWARE' : 'SIMULATION');
    const effectiveDeviceType = deviceTypeOverride || (effectiveSource === 'SIMULATION' ? 'ESP32_RECEIVER_SIM' : 'ESP32_RECEIVER');

    // Store the original packet in the ring buffer exactly as received (max 50)
    this.rawPacketBuffer.unshift({
      timestamp: this.lastPacketTimestamp,
      packet: rawStr,
      gatewayId: effectiveGatewayId,
      sensorNodeId: effectiveSensorNodeId,
    });
    if (this.rawPacketBuffer.length > 50) this.rawPacketBuffer.pop();

    // Keep rawPacket exactly as received — never overwrite with normalised data
    this.latestState.rawPacket = rawStr;
    this.latestState.timestamp = this.lastPacketTimestamp;
    this.latestState.deviceType = effectiveDeviceType;
    this.latestState.gatewayId = effectiveGatewayId;
    this.latestState.sensorNodeId = effectiveSensorNodeId;
    this.latestState.source = effectiveSource;

    // ── Stage 1 ──────────────────────────────────────────────────────────────
    const decoded = this.decodeRawPacket(rawStr);
    if (!decoded) {
      console.warn(`[HARDWARE] Unrecognised packet format: ${rawStr.substring(0, 80)}`);
      return;
    }

    // ── Stage 2 ──────────────────────────────────────────────────────────────
    const mapped = this.mapSemantics(decoded);
    if (!mapped) {
      console.warn(`[HARDWARE] Semantic mapping failed: ${rawStr.substring(0, 80)}`);
      return;
    }

    // ── Stage 3 ──────────────────────────────────────────────────────────────
    const { distanceM, approachRateMps, pitch, roll, ax, ay, az, gx, gy, gz, accelMagnitude, gyroMagnitude, tiltMagnitude } =
      this.normaliseAndDerive(mapped);

    // ── Forward to unified pipeline ──────────────────────────────────────────
    if (this.telemetryCallback) {
      this.telemetryCallback({
        ...this.latestState,
        source: effectiveSource,
        gatewayId: effectiveGatewayId,
        sensorNodeId: effectiveSensorNodeId,
        persist,
      });
    }

    // ── Persist to Supabase (non-blocking) — only if persist is true ──────────
    if (persist) {
      db.logSensorReading({
        sensorId: 'sns-hcsr04-01',
        vehicleId: config.defaultVehicleId,
        distanceM,
        accelX: ax,
        accelY: ay,
        accelZ: az,
        gyroX: gx,
        gyroY: gy,
        gyroZ: gz,
        pitch,
        roll,
        approachRateMps,
        rawPacket: rawStr,
        gatewayId: effectiveGatewayId,
        sensorNodeId: effectiveSensorNodeId,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // PUBLIC STATUS API
  // ---------------------------------------------------------------------------

  /**
   * Returns the current connection status and topology metadata of the
   * ESP32 Receiver/Gateway (the USB-connected device).
   *
   * Note: the receiver itself does NOT contain sensors.
   * Sensor data (MPU6500, HC-SR04) originates from the SENSOR_NODE and is
   * forwarded transparently by the gateway over USB Serial.
   *
   * @returns {{
   *   connected: boolean,
   *   deviceType: "ESP32_RECEIVER",
   *   serialPort: string|null,
   *   baudRate: number,
   *   gatewayId: string,
   *   sensorNodeId: string,
   *   packetCount: number,
   *   lastPacketAt: string|null,
   *   source: "HARDWARE",
   *   latestState: object
   * }}
   */
  getStatus() {
    let connectionState = 'DISCONNECTED';
    if (this.isStopping) connectionState = 'STOPPING';
    else if (this.isConnecting) connectionState = 'CONNECTING';
    else if (this.isConnected) connectionState = 'CONNECTED';
    else if (this.lastError) connectionState = 'ERROR';
    // NETWORK_INGEST: packets arriving via POST /api/hardware/ingest when serial is disconnected
    else if (this.packetCount > 0) connectionState = 'NETWORK_INGEST';

    return {
      connected: this.isConnected,
      deviceType: this.latestState.deviceType,
      serialPort: this.activePortName || null,
      baudRate: config.serial.baudRate,
      gatewayId: this.latestState.gatewayId,
      sensorNodeId: this.latestState.sensorNodeId,
      packetCount: this.packetCount,
      lastPacketAt: this.lastPacketTimestamp,
      source: 'HARDWARE',
      lastError: this.lastError,
      connectionState,
      latestState: this.latestState,
    };
  }

  getRawPackets() {
    return this.rawPacketBuffer;
  }
}

export const hardwareConnector = new HardwareConnector();
