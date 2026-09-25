export type ZoneRiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export type SimulationScenario =
  | 'NORMAL_OPERATION'
  | 'NORMAL'
  | 'FOG_EVENT'
  | 'FOG'
  | 'LOW_VISIBILITY'
  | 'OVERSPEED'
  | 'UNSAFE_DISTANCE'
  | 'COLLISION_RISK'
  | 'SENSOR_FAILURE'
  | 'DEVICE_OFFLINE'
  | 'CRITICAL_INCIDENT';

export interface MiningZone {
  id: string;
  siteId: string;
  name: string;
  code: string;
  polygonCoordinates: Array<[number, number]>; // Polygon lat/lng bounds
  riskLevel: ZoneRiskLevel;
  maxSpeedLimit: number; // km/h
  isRestricted: boolean;
  activeVehiclesCount: number;
  description: string;
}

export interface EnvironmentalCondition {
  siteId: string;
  visibilityMeters: number;
  fogLevelPercent: number;
  humidityPercent: number;
  temperatureCelsius: number;
  windSpeedKmh: number;
  status: 'CLEAR' | 'MODERATE_FOG' | 'DENSE_FOG' | 'HEAVY_RAIN' | 'HIGH_DUST';
  lastUpdated: string;
}
