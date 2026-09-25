export type SensorType = 'RADAR' | 'LIDAR' | 'GPS' | 'VISIBILITY' | 'GAS' | 'VIBRATION' | 'HC_SR04' | 'MPU6500';
export type SensorStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'FAULT';

export interface RadarTelemetry {
  distanceMeters: number;
  relativeSpeedKmh: number;
  objectsDetectedCount: number;
  detectionAngleDegrees: number;
  detectionRangeMeters: number;
}

export interface LidarTelemetry {
  objectsDetectedCount: number;
  scanRangeMeters: number;
  nearestObjectDistanceMeters: number;
  pointCloudHealthPercent: number;
  directionAngleDegrees: number;
}

export interface GpsTelemetry {
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDegrees: number;
  accuracyMeters: number;
  satellitesConnected: number;
}

export interface VisibilityTelemetry {
  visibilityMeters: number;
  fogLevelPercent: number;
  humidityPercent: number;
  status: 'CLEAR' | 'MODERATE_FOG' | 'DENSE_FOG' | 'HEAVY_RAIN' | 'HIGH_DUST';
}

export interface GasTelemetry {
  ch4Ppm: number;
  coPpm: number;
  o2Percent: number;
  status: 'SAFE' | 'WARNING' | 'DANGEROUS';
}

export interface SensorHealth {
  signalStrengthDbm?: number; // e.g. -65
  batteryPercent?: number;
  pointCloudHealthPercent?: number;
  isCalibrated: boolean;
  firmwareVersion: string;
}

export interface SensorTelemetry {
  distanceMeters?: number | null;
  distanceCm?: number | null;
  approachRateMps?: number | null;
  objectDetected?: boolean;
  accelX?: number | null;
  accelY?: number | null;
  accelZ?: number | null;
  gyroX?: number | null;
  gyroY?: number | null;
  gyroZ?: number | null;
  estimatedPitch?: number | null;
  estimatedRoll?: number | null;
  source?: string;
  radar?: RadarTelemetry;
  lidar?: LidarTelemetry;
  gps?: GpsTelemetry;
  visibility?: VisibilityTelemetry;
  gas?: GasTelemetry;
}

export interface Sensor {
  id: string;
  siteId: string;
  vehicleId?: string;
  vehicleCode?: string;
  zoneId?: string;
  name: string; // e.g., HC-SR04 Ultrasonic Distance Sensor
  type: SensorType;
  status: SensorStatus;
  health: SensorHealth;
  directionAngle?: number; // 0=Front, 90=Right, 180=Rear, 270=Left
  detectionRangeMeters?: number;
  purpose?: string;
  lastUpdate: string;
  isFutureDeployment?: boolean;
  source?: string;
  confidence?: number;
  telemetry: SensorTelemetry;
}

