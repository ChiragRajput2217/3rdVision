export type Role = 'driver' | 'manager' | 'inspector';

export type NetworkStatus = 'LIVE' | 'SIMULATION' | 'CONNECTING' | 'OFFLINE';

export interface TelemetryData {
  visibility?: number;
  activeAlerts?: number;
  activeVehicles?: number;
  activeSensors?: number;
}
