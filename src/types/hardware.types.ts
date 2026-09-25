export interface HardwareRaw {
  sequenceNumber: number | null;
  distanceCm: number | null;
  distanceM: number | null;
  accelX: number | null;
  accelY: number | null;
  accelZ: number | null;
  gyroX: number | null;
  gyroY: number | null;
  gyroZ: number | null;
  rssiDbm: number | null;
  validFlag: number | null;
}

export interface HardwareDerived {
  pitch: number | null;
  roll: number | null;
  approachRateMps: number;
  distanceChangeM: number;
  motionState: 'STATIONARY' | 'IN_MOTION' | 'HIGH_VIBRATION' | string;
  accelMagnitude: number | null;
}

export interface HardwareLatestState {
  source: string;
  deviceType: string;
  gatewayId: string;
  sensorNodeId: string;
  connected: boolean;
  port: string | null;
  baudRate: number;
  rawPacket: string | null;
  timestamp: string | null;
  raw: HardwareRaw;
  derived: HardwareDerived;
}

export interface HardwareStatus {
  connected: boolean;
  deviceType: string;
  serialPort: string | null;
  baudRate: number;
  gatewayId: string;
  sensorNodeId: string;
  packetCount: number;
  lastPacketAt: string | null;
  source: string;
  lastError: string | null;
  connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'STOPPING' | 'ERROR' | 'NETWORK_INGEST' | string;
  latestState: HardwareLatestState;
}

export interface RawPacket {
  timestamp: string;
  packet: string;
  gatewayId?: string;
  sensorNodeId?: string;
}
