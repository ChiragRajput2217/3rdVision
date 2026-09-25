export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';
export type AlertCategory = 
  | 'COLLISION_RISK'
  | 'VISIBILITY_HAZARD'
  | 'OVERSPEED'
  | 'PROXIMITY'
  | 'SENSOR_FAILURE'
  | 'ZONE_INTRUSION'
  | 'ENVIRONMENTAL';

export interface Alert {
  id: string;
  siteId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  vehicleId?: string;
  vehicleCode?: string;
  secondaryVehicleId?: string;
  secondaryVehicleCode?: string;
  sensorId?: string;
  sensorName?: string;
  zoneId?: string;
  zoneName?: string;
  currentValue: string; // e.g. "Visibility: 3.2m, Distance: 12m"
  riskScorePercent: number;
  recommendedAction: string;
  timestamp: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}
