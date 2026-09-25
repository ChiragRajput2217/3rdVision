export interface AnalyticsTimePoint {
  time: string;
  safetyScore: number;
  nearMisses: number;
  criticalAlerts: number;
  avgSpeedKmh: number;
  visibilityMeters: number;
  fleetUtilizationPercent: number;
}

export interface ManagementOverviewData {
  safetyScore: number; // 0 - 100
  nearMissesCount: number;
  criticalEventsCount: number;
  activeVehiclesCount: number;
  fleetUtilizationPercent: number;
  avgCycleTimeMinutes: number;
  idleTimePercent: number;
  environmentalDowntimeHours: number;
  timeSeries: AnalyticsTimePoint[];
  highRiskZones: {
    zoneName: string;
    riskScore: number;
    incidentCount: number;
  }[];
}
