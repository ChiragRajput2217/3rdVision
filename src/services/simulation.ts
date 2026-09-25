import {
  MiningSite,
  MiningZone,
  Vehicle,
  Sensor,
  Alert,
  Incident,
  SimulationScenario,
  ManagementOverviewData,
} from '../types';
import {
  MOCK_SITES,
  MOCK_ZONES,
  MOCK_VEHICLES,
  MOCK_SENSORS,
  MOCK_ALERTS,
  MOCK_INCIDENTS,
  MOCK_MANAGEMENT_ANALYTICS,
} from './mockData';

export type SimulationListener = (state: SimulationState) => void;

export interface SimulationState {
  sites: MiningSite[];
  zones: MiningZone[];
  vehicles: Vehicle[];
  sensors: Sensor[];
  alerts: Alert[];
  incidents: Incident[];
  activeScenario: SimulationScenario;
  isPlaying: boolean;
  speedMs: number;
  lastTickAt: string;
}

class SimulationEngine {
  private state: SimulationState;
  private listeners: Set<SimulationListener> = new Set();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;
  private liveMode = false; // true when backend Socket.IO is connected

  constructor() {
    this.state = {
      sites: JSON.parse(JSON.stringify(MOCK_SITES)),
      zones: JSON.parse(JSON.stringify(MOCK_ZONES)),
      vehicles: JSON.parse(JSON.stringify(MOCK_VEHICLES)),
      sensors: JSON.parse(JSON.stringify(MOCK_SENSORS)),
      alerts: JSON.parse(JSON.stringify(MOCK_ALERTS)),
      incidents: JSON.parse(JSON.stringify(MOCK_INCIDENTS)),
      activeScenario: 'FOG_EVENT',
      isPlaying: true,
      speedMs: 2000,
      lastTickAt: new Date().toISOString(),
    };

    this.startLoop();
  }

  // --- LIVE MODE (Backend Connected) ---
  /**
   * When the backend Socket.IO is connected, pause the frontend simulation tick
   * loop so it does not overwrite authoritative backend telemetry.
   * When the backend disconnects, resume the frontend loop as offline fallback.
   */
  public setLiveMode(isLive: boolean): void {
    this.liveMode = isLive;
    if (isLive) {
      // Pause local tick loop — backend is the authoritative state source
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    } else {
      // Backend offline — resume frontend fallback simulation
      if (this.state.isPlaying && !this.timerId) {
        this.startLoop();
      }
    }
  }

  public isInLiveMode(): boolean {
    return this.liveMode;
  }

  // --- GETTERS (Clean Interface) ---
  public getState(): SimulationState {
    return this.state;
  }

  public getSites(): MiningSite[] {
    return this.state.sites;
  }

  public getZones(siteId?: string): MiningZone[] {
    if (!siteId) return this.state.zones;
    return this.state.zones.filter((z) => z.siteId === siteId);
  }

  public getVehicles(siteId?: string): Vehicle[] {
    if (!siteId) return this.state.vehicles;
    return this.state.vehicles.filter((v) => v.siteId === siteId);
  }

  public getSensors(siteId?: string): Sensor[] {
    if (!siteId) return this.state.sensors;
    return this.state.sensors.filter((s) => s.siteId === siteId);
  }

  public getAlerts(siteId?: string): Alert[] {
    if (!siteId) return this.state.alerts;
    return this.state.alerts.filter((a) => a.siteId === siteId);
  }

  public getIncidents(siteId?: string): Incident[] {
    if (!siteId) return this.state.incidents;
    return this.state.incidents.filter((i) => i.siteId === siteId);
  }

  public getTelemetry(vehicleId: string) {
    const v = this.state.vehicles.find((veh) => veh.id === vehicleId);
    return v ? v.telemetry : null;
  }

  public getRiskPredictions() {
    return this.state.vehicles.map((v) => ({
      vehicleId: v.id,
      vehicleCode: v.code,
      riskScorePercent: v.telemetry.riskScorePercent,
      riskLevel: v.status,
      riskFactors: v.telemetry.riskFactors,
      recommendedAction: v.telemetry.recommendedAction,
      nearestDistance: v.telemetry.nearestVehicleDistanceMeters,
    }));
  }

  public getManagementAnalytics(): ManagementOverviewData {
    const criticalCount = this.state.alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
    const warningCount = this.state.alerts.filter((a) => a.severity === 'WARNING' || a.severity === 'HIGH').length;

    return {
      ...MOCK_MANAGEMENT_ANALYTICS,
      criticalEventsCount: criticalCount,
      nearMissesCount: Math.max(3, warningCount + criticalCount),
      safetyScore: Math.max(60, 95 - criticalCount * 12 - warningCount * 3),
    };
  }

  // --- ACTIONS ---
  public subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public setScenario(scenario: SimulationScenario) {
    this.state.activeScenario = scenario;
    this.applyScenarioImmediateEffects(scenario);
    this.notify();
  }

  public setSpeedMs(speedMs: number) {
    this.state.speedMs = speedMs;
    this.startLoop();
    this.notify();
  }

  public togglePlayPause() {
    this.state.isPlaying = !this.state.isPlaying;
    if (this.state.isPlaying) {
      this.startLoop();
    } else if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notify();
  }

  public acknowledgeAlert(alertId: string, acknowledgedBy: string) {
    const alert = this.state.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      this.notify();
    }
  }

  public resolveAlert(alertId: string) {
    const alert = this.state.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      this.notify();
    }
  }

  public updateVehicleSpeed(vehicleId: string, speedKmh: number) {
    const vehicle = this.state.vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      vehicle.telemetry.speedKmh = speedKmh;
      if (speedKmh <= vehicle.telemetry.recommendedSpeedKmh) {
        // Reduced speed: reduce risk
        vehicle.telemetry.riskScorePercent = Math.max(25, vehicle.telemetry.riskScorePercent - 30);
        if (vehicle.telemetry.riskScorePercent < 50) {
          vehicle.status = 'WARNING';
        }
        if (vehicle.telemetry.riskScorePercent < 30) {
          vehicle.status = 'SAFE';
        }
      }
      this.notify();
    }
  }

  public restrictZone(zoneId: string) {
    const zone = this.state.zones.find((z) => z.id === zoneId);
    if (zone) {
      zone.isRestricted = true;
      zone.riskLevel = 'EXTREME';
      zone.maxSpeedLimit = 0;
      this.notify();
    }
  }

  // --- SIMULATION LOOP & CAUSE -> EFFECT MODEL ---
  private startLoop() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (this.state.isPlaying) {
        this.tick();
      }
    }, this.state.speedMs);
  }

  private tick() {
    this.tickCount++;
    this.state.lastTickAt = new Date().toISOString();

    const site = this.state.sites.find((s) => s.id === 'site-kirandul-01');
    const d104 = this.state.vehicles.find((v) => v.code === 'D-104');
    const d108 = this.state.vehicles.find((v) => v.code === 'D-108');
    const p301 = this.state.vehicles.find((v) => v.code === 'P-301');
    const radar = this.state.sensors.find((s) => s.id === 'sns-rad-104');
    const lidar = this.state.sensors.find((s) => s.id === 'sns-lid-104');
    const visSensor = this.state.sensors.find((s) => s.id === 'sns-vis-station-01');

    // CAUSE -> EFFECT RELATIONSHIPS ACCORDING TO ACTIVE SCENARIO
    switch (this.state.activeScenario) {
      case 'NORMAL_OPERATION':
      case 'NORMAL':
        if (site) {
          site.currentCondition.visibilityMeters = Math.min(25.0, site.currentCondition.visibilityMeters + 1.5);
          site.currentCondition.fogLevelPercent = Math.max(5, site.currentCondition.fogLevelPercent - 5);
          site.currentCondition.status = 'CLEAR';
          site.status = 'OPERATIONAL';
        }
        if (d104) {
          d104.telemetry.speedKmh = 16;
          d104.telemetry.recommendedSpeedKmh = 20;
          d104.telemetry.nearestVehicleDistanceMeters = 24.5;
          d104.telemetry.relativeSpeedKmh = 2;
          d104.telemetry.riskScorePercent = 14;
          d104.status = 'SAFE';
          d104.telemetry.riskFactors = [];
          d104.telemetry.recommendedAction = 'NORMAL HAULAGE OPERATIONAL';
        }
        if (d108) {
          d108.status = 'SAFE';
          d108.telemetry.riskScorePercent = 18;
        }
        break;

      case 'FOG_EVENT':
      case 'LOW_VISIBILITY':
        if (site) {
          site.currentCondition.visibilityMeters = Math.max(3.2, site.currentCondition.visibilityMeters - 0.8);
          site.currentCondition.fogLevelPercent = Math.min(84, site.currentCondition.fogLevelPercent + 4);
          site.currentCondition.status = 'DENSE_FOG';
          site.status = 'WARNING';
        }
        if (d104) {
          d104.telemetry.recommendedSpeedKmh = 10;
          d104.telemetry.riskScorePercent = Math.min(78, d104.telemetry.riskScorePercent + 5);
          if (d104.telemetry.riskScorePercent > 60) {
            d104.status = 'HIGH_RISK';
          }
          d104.telemetry.riskFactors = [
            'Dense Atmospheric Fog (Vis < 4m)',
            'Reduced Optical Line of Sight',
            'Slippery Bench Slope Moisture',
          ];
          d104.telemetry.recommendedAction = 'REDUCE SPEED TO 10 KM/H & ENGAGE STROBE LAMPS';
        }
        break;

      case 'UNSAFE_DISTANCE':
      case 'COLLISION_RISK':
      case 'CRITICAL_INCIDENT':
        if (site) {
          site.currentCondition.visibilityMeters = 3.2;
          site.currentCondition.fogLevelPercent = 78;
          site.currentCondition.status = 'DENSE_FOG';
          site.status = 'CRITICAL';
        }
        if (d104 && d108) {
          // Dynamic oscillatory movement simulating approaching near-miss
          const dist = 3.0 + Math.sin(this.tickCount * 0.8) * 0.8;
          d104.telemetry.nearestVehicleDistanceMeters = parseFloat(dist.toFixed(1));
          d104.telemetry.speedKmh = 18;
          d104.telemetry.recommendedSpeedKmh = 8;
          d104.telemetry.relativeSpeedKmh = 28;
          d104.telemetry.riskScorePercent = 91;
          d104.status = 'CRITICAL';
          d104.telemetry.riskFactors = [
            'Dense Fog (Visibility < 3.5m)',
            'Blind Ramp Curve Approaching',
            'Head-on Collision Trajectory with D-108',
            'Speed Exceeds Safe Braking Distance',
          ];
          d104.telemetry.recommendedAction = 'REDUCE SPEED TO 8 KM/H IMMEDIATELY & ENGAGE AUXILIARY BRAKE';

          d108.telemetry.nearestVehicleDistanceMeters = parseFloat(dist.toFixed(1));
          d108.status = 'HIGH_RISK';
          d108.telemetry.riskScorePercent = 82;
        }
        break;

      case 'OVERSPEED':
        if (p301) {
          p301.telemetry.speedKmh = 32;
          p301.telemetry.recommendedSpeedKmh = 20;
          p301.telemetry.riskScorePercent = 68;
          p301.status = 'WARNING';
          p301.telemetry.riskFactors = ['Exceeding Zone Speed Limit (32 km/h vs 20 km/h)'];
          p301.telemetry.recommendedAction = 'SLOW DOWN IMMEDIATELY ON GRADIENT RAMP';
        }
        break;

      case 'SENSOR_FAILURE':
      case 'DEVICE_OFFLINE':
        if (lidar) {
          lidar.status = 'OFFLINE';
          lidar.health.batteryPercent = 15;
          lidar.health.signalStrengthDbm = -92;
          lidar.health.pointCloudHealthPercent = 12;
        }
        if (radar) {
          radar.status = 'DEGRADED';
          radar.health.signalStrengthDbm = -85;
        }
        break;
    }

    // UPDATE SENSOR TELEMETRY READINGS
    if (visSensor && site) {
      visSensor.telemetry = {
        visibility: {
          visibilityMeters: site.currentCondition.visibilityMeters,
          fogLevelPercent: site.currentCondition.fogLevelPercent,
          humidityPercent: site.currentCondition.humidityPercent,
          status: site.currentCondition.status,
        },
      };
    }

    if (radar && d104) {
      radar.telemetry = {
        radar: {
          distanceMeters: d104.telemetry.nearestVehicleDistanceMeters || 3.2,
          relativeSpeedKmh: d104.telemetry.relativeSpeedKmh || 28,
          objectsDetectedCount: 2,
          detectionAngleDegrees: 15,
          detectionRangeMeters: 80,
        },
      };
    }

    // ENSURE ALERT STATES MATCH SIMULATION CRITICALITY
    this.ensureAlertConsistency();

    this.notify();
  }

  private applyScenarioImmediateEffects(scenario: SimulationScenario) {
    const site = this.state.sites.find((s) => s.id === 'site-kirandul-01');
    if (!site) return;

    if (scenario === 'NORMAL_OPERATION' || scenario === 'NORMAL') {
      site.currentCondition.visibilityMeters = 25.0;
      site.currentCondition.fogLevelPercent = 10;
      site.currentCondition.status = 'CLEAR';
      site.status = 'OPERATIONAL';
    } else if (scenario === 'FOG_EVENT' || scenario === 'LOW_VISIBILITY') {
      site.currentCondition.visibilityMeters = 3.2;
      site.currentCondition.fogLevelPercent = 78;
      site.currentCondition.status = 'DENSE_FOG';
      site.status = 'WARNING';
    } else if (scenario === 'COLLISION_RISK' || scenario === 'CRITICAL_INCIDENT' || scenario === 'UNSAFE_DISTANCE') {
      site.currentCondition.visibilityMeters = 3.2;
      site.currentCondition.fogLevelPercent = 78;
      site.currentCondition.status = 'DENSE_FOG';
      site.status = 'CRITICAL';
    }
  }

  private ensureAlertConsistency() {
    const criticalAlertExists = this.state.alerts.some(
      (a) => a.id === 'alt-col-9102' && (a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED')
    );

    if (
      (this.state.activeScenario === 'COLLISION_RISK' ||
        this.state.activeScenario === 'CRITICAL_INCIDENT' ||
        this.state.activeScenario === 'UNSAFE_DISTANCE') &&
      !criticalAlertExists
    ) {
      this.state.alerts.unshift({
        id: 'alt-col-9102',
        siteId: 'site-kirandul-01',
        category: 'COLLISION_RISK',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'Predicted High-Speed Head-on Collision Risk',
        description: 'ML model estimated risk score: 91% — D-104 and D-108 in close proximity near blind curve in Pit Bench B-4.',
        vehicleId: 'veh-d104',
        vehicleCode: 'D-104',
        secondaryVehicleId: 'veh-d108',
        secondaryVehicleCode: 'D-108',
        sensorId: 'sns-rad-104',
        sensorName: 'Front mmWave Radar 77GHz',
        zoneId: 'zone-b4',
        zoneName: 'Pit Bench B-4',
        currentValue: 'Distance: 3.2m | Closing Speed: +28 km/h | Vis: 3.2m',
        riskScorePercent: 91,
        recommendedAction: 'Reduce speed to 8 km/h & divert D-104 to outer safety turnout bench.',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const simulationEngine = new SimulationEngine();
