export type VehicleStatus = 'SAFE' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';
export type VehicleType = 'DUMPER' | 'EXCAVATOR' | 'HAUL_TRUCK' | 'DRILL_RIG' | 'PATROL';

export interface VehicleTelemetry {
  speedKmh: number;
  recommendedSpeedKmh: number;
  latitude: number | null;
  longitude: number | null;
  heading?: number | null; // degrees 0-360
  fuelLevelPercent?: number | null;
  engineTempCelsius?: number | null;
  nearestVehicleId?: string | null;
  nearestVehicleName?: string | null;
  nearestVehicleDistanceMeters?: number | null; // Object Distance (m) detected by forward sensor
  relativeSpeedKmh?: number | null;
  riskScorePercent: number;
  riskLevel: VehicleStatus;
  riskFactors: string[];
  recommendedAction: string;
  lastUpdate: string;
  source?: string;
  pitch?: number | null;
  roll?: number | null;
}


export interface Vehicle {
  id: string;
  siteId: string;
  zoneId: string;
  code: string; // e.g. D-104
  name: string;
  type: VehicleType;
  model?: string;
  driverName?: string;
  operatorId?: string;
  operatorName?: string;
  operatorPhone?: string;
  assignedZoneName?: string;
  status: VehicleStatus;
  telemetry: VehicleTelemetry;
  sensorsAttached: string[]; // sensor IDs
}
