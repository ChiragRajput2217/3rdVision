import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

class DatabaseService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.cache = {
      sites: [],
      zones: [],
      vehicles: [],
      sensors: [],
      alerts: [],
      incidents: [],
      telemetryHistory: [],
    };
    this.init();
  }

  init() {
    const { url, serviceRoleKey, anonKey } = config.supabase;
    const key = serviceRoleKey || anonKey;

    if (url && key) {
      try {
        this.client = createClient(url, key, {
          auth: { persistSession: false },
        });
        this.isConnected = true;
        console.log(' Connected directly to Supabase Cloud PostgreSQL:', url);
        this.syncCacheFromCloud();
      } catch (err) {
        console.warn('⚠️ Supabase client initialization warning:', err.message);
        this.loadDefaultBootstrap();
      }
    } else {
      console.warn('ℹ️ SUPABASE_URL or SUPABASE_ANON_KEY not set in .env. Initializing in cloud-ready fallback mode with standard NMDC dataset.');
      this.loadDefaultBootstrap();
    }
  }

  loadDefaultBootstrap() {
    this.cache.sites = [
      {
        id: 'site-kirandul-01',
        organizationId: 'org-nmdc-01',
        name: 'Kirandul Iron Ore Complex',
        code: 'NMDC-KRD-14',
        location: 'Bailadila Deposit 14, Dantewada',
        state: 'Chhattisgarh',
        coordinates: [18.6312, 81.2485],
        status: 'CRITICAL',
        currentCondition: {
          visibilityMeters: 3.2,
          fogLevelPercent: 78,
          humidityPercent: 88,
          temperatureCelsius: 22,
          status: 'DENSE_FOG',
          updatedAt: new Date().toISOString(),
        },
        totalVehicles: 82,
        totalSensors: 2,
        activeAlertsCount: 1,
      },
      {
        id: 'site-bacheli-02',
        organizationId: 'org-nmdc-01',
        name: 'Bacheli Complex Mine',
        code: 'NMDC-BCH-05',
        location: 'Bailadila Deposit 5, Bacheli',
        state: 'Chhattisgarh',
        coordinates: [18.7124, 81.2842],
        status: 'OPERATIONAL',
        currentCondition: {
          visibilityMeters: 18.5,
          fogLevelPercent: 15,
          humidityPercent: 48,
          temperatureCelsius: 27,
          status: 'CLEAR',
          updatedAt: new Date().toISOString(),
        },
        totalVehicles: 64,
        totalSensors: 0,
        activeAlertsCount: 0,
      },
    ];

    this.cache.zones = [
      {
        id: 'zone-b4',
        siteId: 'site-kirandul-01',
        name: 'Pit Bench B-4 (Active Excavation)',
        code: 'PIT-B4',
        polygonCoordinates: [
          [18.6330, 81.2460],
          [18.6345, 81.2490],
          [18.6320, 81.2510],
          [18.6305, 81.2475],
        ],
        riskLevel: 'HIGH',
        maxSpeedLimit: 15,
        isRestricted: false,
        activeVehiclesCount: 2,
        description: 'Deep pit slope with reduced visibility during early morning fog.',
      },
      {
        id: 'zone-haul-ramp',
        siteId: 'site-kirandul-01',
        name: 'Main Haul Ramp #2 (Gradient 8%)',
        code: 'RAMP-H2',
        polygonCoordinates: [
          [18.6310, 81.2440],
          [18.6325, 81.2465],
          [18.6295, 81.2480],
          [18.6280, 81.2455],
        ],
        riskLevel: 'MEDIUM',
        maxSpeedLimit: 20,
        isRestricted: false,
        activeVehiclesCount: 1,
        description: 'High volume dumper ramp connecting pit floor to primary crusher.',
      },
    ];

    this.cache.vehicles = [
      {
        id: 'veh-d104',
        siteId: 'site-kirandul-01',
        zoneId: 'zone-b4',
        code: 'D-104',
        name: 'CAT 777G Haul Dumper (100T)',
        type: 'DUMPER',
        operatorId: 'usr-driver-104',
        operatorName: 'Suresh Patel',
        operatorPhone: '+91 98765 43210',
        status: 'CRITICAL',
        telemetry: {
          speedKmh: 16,
          recommendedSpeedKmh: 8,
          latitude: 18.6325,
          longitude: 81.2482,
          heading: 135,
          fuelLevelPercent: 78,
          engineTempCelsius: 85,
          nearestVehicleId: 'veh-d108',
          nearestVehicleName: 'D-108 (Komatsu HD785)',
          nearestVehicleDistanceMeters: 3.2,
          relativeSpeedKmh: 28,
          riskScorePercent: 91,
          riskLevel: 'CRITICAL',
          riskFactors: [
            'HC-SR04 Obstacle Proximity (< 5m)',
            'Dense Atmospheric Fog (Visibility: 3.2m)',
            'Estimated Approach Rate Exceeds Headway',
          ],
          recommendedAction: 'Reduce speed immediately and maintain safe following distance.',
          lastUpdate: new Date().toISOString(),
          source: 'SIMULATION',
          pitch: 2.1,
          roll: 1.0,
        },
        sensorsAttached: ['sns-hcsr04-01', 'sns-mpu6500-01'],
      },
      {
        id: 'veh-d108',
        siteId: 'site-kirandul-01',
        zoneId: 'zone-b4',
        code: 'D-108',
        name: 'Komatsu HD785 Dumper',
        type: 'DUMPER',
        operatorId: 'usr-driver-108',
        operatorName: 'Ramesh Naidu',
        operatorPhone: '+91 98765 43211',
        status: 'HIGH_RISK',
        telemetry: {
          speedKmh: 14,
          recommendedSpeedKmh: 10,
          latitude: 18.6323,
          longitude: 81.2485,
          heading: 315,
          fuelLevelPercent: 62,
          engineTempCelsius: 84,
          nearestVehicleId: 'veh-d104',
          nearestVehicleName: 'D-104 (CAT 777G)',
          nearestVehicleDistanceMeters: 3.2,
          relativeSpeedKmh: -28,
          riskScorePercent: 82,
          riskLevel: 'HIGH_RISK',
          riskFactors: ['Approaching Turnout in Fog', 'Low Ambient Visibility'],
          recommendedAction: 'Reduce speed and hold position on outer shoulder.',
          lastUpdate: new Date().toISOString(),
          source: 'SIMULATION',
        },
        sensorsAttached: [],
      },
    ];

    // ACTUAL PHYSICAL PROTOTYPE SENSORS ONLY:
    // 1. HC-SR04 Ultrasonic Distance Sensor
    // 2. MPU6500 6-Axis Motion Sensor (Accelerometer + Gyroscope)
    this.cache.sensors = [
      {
        id: 'sns-hcsr04-01',
        siteId: 'site-kirandul-01',
        vehicleId: 'veh-d104',
        vehicleCode: 'D-104',
        zoneId: 'zone-b4',
        name: 'HC-SR04 Ultrasonic Distance Sensor',
        type: 'HC_SR04',
        status: 'ONLINE',
        source: 'HARDWARE',
        confidence: 0.95,
        health: {
          signalStrengthDbm: -55,
          batteryPercent: 100,
          isCalibrated: true,
          firmwareVersion: 'ESP32-v1.0',
        },
        directionAngle: 0,
        detectionRangeMeters: 4.0,
        purpose: 'Measures front obstacle distance via ultrasonic echo pulses.',
        lastUpdate: new Date().toISOString(),
        isFutureDeployment: false,
        telemetry: {
          // Both generic and frontend-compatible radar object shape
          distanceMeters: 3.2,
          approachRateMps: 0.8,
          radar: {
            distanceMeters: 3.2,
            relativeSpeedKmh: 8,
            objectsDetectedCount: 1,
            detectionAngleDegrees: 0,
            detectionRangeMeters: 4,
          },
        },
      },
      {
        id: 'sns-mpu6500-01',
        siteId: 'site-kirandul-01',
        vehicleId: 'veh-d104',
        vehicleCode: 'D-104',
        zoneId: 'zone-b4',
        name: 'MPU6500 6-Axis Motion Sensor',
        type: 'MPU6500',
        status: 'ONLINE',
        source: 'HARDWARE',
        confidence: 0.98,
        health: {
          batteryPercent: 100,
          isCalibrated: true,
          firmwareVersion: 'ESP32-v1.0',
        },
        directionAngle: 0,
        detectionRangeMeters: 0,
        purpose: 'Captures 3-axis acceleration and angular rate to calculate estimated pitch and roll.',
        lastUpdate: new Date().toISOString(),
        isFutureDeployment: false,
        telemetry: {
          accelX: 0.1,
          accelY: -0.2,
          accelZ: 9.8,
          gyroX: 0.0,
          gyroY: 0.0,
          gyroZ: 0.0,
          estimatedPitch: 2.1,
          estimatedRoll: 1.0,
        },
      },
    ];

    this.cache.alerts = [
      {
        id: 'alt-col-9102',
        siteId: 'site-kirandul-01',
        category: 'COLLISION_RISK',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'High Estimated Collision Risk (D-104)',
        description: 'HC-SR04 ultrasonic distance sensor detected obstacle at 3.2m in low-visibility conditions. Closing distance narrowing.',
        vehicleId: 'veh-d104',
        vehicleCode: 'D-104',
        secondaryVehicleId: 'veh-d108',
        secondaryVehicleCode: 'D-108',
        sensorId: 'sns-hcsr04-01',
        sensorName: 'HC-SR04 Ultrasonic Distance Sensor',
        zoneId: 'zone-b4',
        zoneName: 'Pit Bench B-4',
        currentValue: 'Distance: 3.2m | Estimated Risk: 91%',
        riskScorePercent: 91,
        recommendedAction: 'Reduce speed immediately and maintain safe following distance.',
        timestamp: new Date().toISOString(),
      },
    ];

    this.cache.incidents = [
      {
        id: 'inc-2026-041',
        siteId: 'site-kirandul-01',
        incidentNumber: 'INC-2026-041',
        title: 'Near-Miss Proximity Alert under Dense Fog (Pit Bench B-4)',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        vehicleIds: ['veh-d104', 'veh-d108'],
        vehicleCodes: ['D-104', 'D-108'],
        zoneId: 'zone-b4',
        zoneName: 'Pit Bench B-4',
        riskScore: 91,
        description: 'HC-SR04 sensor proximity alert triggered visual & audible in-cab warning chime. Vehicles passed within safe turnout distance.',
        rootCause: 'Reduced visibility combined with excessive speed on ramp gradient.',
        preventativeAction: 'Enforce advisory speed guidelines during atmospheric fog events.',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async syncCacheFromCloud() {
    if (!this.client) return;
    try {
      const [sitesRes, zonesRes, vehiclesRes, sensorsRes, alertsRes] = await Promise.all([
        this.client.from('sites').select('*'),
        this.client.from('zones').select('*'),
        this.client.from('vehicles').select('*'),
        this.client.from('sensors').select('*'),
        this.client.from('alerts').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (sitesRes.data && sitesRes.data.length > 0) {
        this.cache.sites = sitesRes.data.map((s) => ({
          id: s.id,
          organizationId: s.organization_id,
          name: s.name,
          code: s.code,
          location: s.location,
          state: s.state,
          coordinates: [s.latitude, s.longitude],
          status: s.status,
          currentCondition: {
            visibilityMeters: 25.0,
            fogLevelPercent: 10,
            humidityPercent: 60,
            temperatureCelsius: 24,
            status: 'CLEAR',
            updatedAt: new Date().toISOString(),
          },
          totalVehicles: 82,
          totalSensors: 2,
          activeAlertsCount: 0,
        }));
      }

      if (zonesRes.data && zonesRes.data.length > 0) {
        this.cache.zones = zonesRes.data.map((z) => ({
          id: z.id,
          siteId: z.site_id,
          name: z.name,
          code: z.code,
          polygonCoordinates: z.polygon || [],
          riskLevel: z.risk_level,
          maxSpeedLimit: z.max_speed,
          isRestricted: z.is_restricted,
          activeVehiclesCount: 0,
          description: z.description,
        }));
      }

      if (vehiclesRes.data && vehiclesRes.data.length > 0) {
        this.cache.vehicles = vehiclesRes.data.map((v) => ({
          id: v.id,
          siteId: v.site_id,
          zoneId: v.zone_id,
          code: v.code,
          name: v.name,
          type: v.type,
          operatorId: v.operator_id,
          operatorName: v.operator_name,
          operatorPhone: v.operator_phone,
          status: v.status,
          telemetry: {
            speedKmh: v.simulated ? 16 : null,
            recommendedSpeedKmh: 20,
            latitude: v.simulated ? 18.6325 : null,
            longitude: v.simulated ? 81.2482 : null,
            heading: v.simulated ? 135 : null,
            fuelLevelPercent: v.simulated ? 80 : null,
            engineTempCelsius: v.simulated ? 82 : null,
            riskScorePercent: 15,
            riskLevel: 'SAFE',
            riskFactors: [],
            recommendedAction: 'NORMAL HAULAGE OPERATIONAL',
            lastUpdate: new Date().toISOString(),
            source: v.simulated ? 'SIMULATION' : 'HARDWARE',
          },
          sensorsAttached: ['sns-hcsr04-01', 'sns-mpu6500-01'],
        }));
      }

      if (sensorsRes.data && sensorsRes.data.length > 0) {
        this.cache.sensors = sensorsRes.data.map((s) => ({
          id: s.id,
          siteId: s.site_id,
          vehicleId: s.vehicle_id,
          zoneId: s.zone_id,
          name: s.name,
          type: s.type,
          status: s.status,
          source: s.source,
          confidence: s.confidence || 1.0,
          health: s.health || {},
          directionAngle: s.direction_angle || 0,
          detectionRangeMeters: s.detection_range_meters || 4.0,
          purpose: s.purpose,
          lastUpdate: s.last_seen || new Date().toISOString(),
          isFutureDeployment: s.is_future_deployment || false,
          telemetry: {},
        }));
      }

      console.log(`☁️ Supabase sync complete: ${this.cache.sites.length} sites, ${this.cache.vehicles.length} vehicles, ${this.cache.sensors.length} sensors.`);
    } catch (err) {
      console.warn('⚠️ Error during initial Supabase sync:', err.message);
      this.loadDefaultBootstrap();
    }
  }

  // --- QUERY APIS ---

  async getSites() {
    return this.cache.sites;
  }

  async getSiteById(siteId) {
    return this.cache.sites.find((s) => s.id === siteId) || this.cache.sites[0];
  }

  async getZones(siteId) {
    if (!siteId) return this.cache.zones;
    return this.cache.zones.filter((z) => z.siteId === siteId);
  }

  async getVehicles(siteId) {
    if (!siteId) return this.cache.vehicles;
    return this.cache.vehicles.filter((v) => v.siteId === siteId);
  }

  async getVehicleById(vehicleId) {
    return this.cache.vehicles.find((v) => v.id === vehicleId) || null;
  }

  async getSensors(siteId) {
    if (!siteId) return this.cache.sensors;
    return this.cache.sensors.filter((s) => s.siteId === siteId);
  }

  async getAlerts(siteId) {
    if (!siteId) return this.cache.alerts;
    return this.cache.alerts.filter((a) => a.siteId === siteId);
  }

  async getIncidents(siteId) {
    if (!siteId) return this.cache.incidents;
    return this.cache.incidents.filter((i) => i.siteId === siteId);
  }

  async saveAlert(alert) {
    const existingIndex = this.cache.alerts.findIndex((a) => a.id === alert.id);
    if (existingIndex >= 0) {
      this.cache.alerts[existingIndex] = { ...this.cache.alerts[existingIndex], ...alert };
    } else {
      this.cache.alerts.unshift(alert);
    }

    if (this.client) {
      try {
        await this.client.from('alerts').upsert({
          id: alert.id,
          site_id: alert.siteId,
          vehicle_id: alert.vehicleId || null,
          sensor_id: alert.sensorId || null,
          severity: alert.severity,
          category: alert.category,
          status: alert.status,
          title: alert.title,
          description: alert.description,
          current_value: alert.currentValue || '',
          risk_score_percent: alert.riskScorePercent || 0,
          recommended_action: alert.recommendedAction || '',
          acknowledged_at: alert.acknowledgedAt || null,
          acknowledged_by: alert.acknowledgedBy || null,
          resolved_at: alert.resolvedAt || null,
        });
      } catch (err) {
        console.warn('⚠️ Cloud alert write warning:', err.message);
      }
    }

    return alert;
  }

  async acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.cache.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'ACKNOWLEDGED';
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      await this.saveAlert(alert);
      return alert;
    }
    return null;
  }

  async resolveAlert(alertId) {
    const alert = this.cache.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
      await this.saveAlert(alert);
      return alert;
    }
    return null;
  }

  async saveIncident(incident) {
    this.cache.incidents.unshift(incident);
    if (this.client) {
      try {
        await this.client.from('incidents').insert({
          id: incident.id,
          site_id: incident.siteId,
          incident_number: incident.incidentNumber,
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          vehicle_ids: incident.vehicleIds || [],
          zone_id: incident.zoneId || null,
          risk_score: incident.riskScore || 0,
          description: incident.description,
          root_cause: incident.rootCause || null,
          preventative_action: incident.preventativeAction || null,
          created_at: incident.createdAt || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('⚠️ Cloud incident write warning:', err.message);
      }
    }
    return incident;
  }

  async logSensorReading(reading) {
    if (this.client) {
      try {
        await this.client.from('sensor_readings').insert({
          sensor_id: reading.sensorId,
          vehicle_id: reading.vehicleId || null,
          device_id: reading.deviceId || 'ESP32-NODE-01',
          distance_m: reading.distanceM ?? null,
          accel_x: reading.accelX ?? null,
          accel_y: reading.accelY ?? null,
          accel_z: reading.accelZ ?? null,
          gyro_x: reading.gyroX ?? null,
          gyro_y: reading.gyroY ?? null,
          gyro_z: reading.gyroZ ?? null,
          estimated_pitch: reading.estimatedPitch ?? null,
          estimated_roll: reading.estimatedRoll ?? null,
          approach_rate_mps: reading.approachRateMps ?? null,
          confidence: reading.confidence ?? 1.0,
          raw_packet: reading.rawPacket || null,
          source: reading.source || 'HARDWARE',
        });
      } catch (err) {
        // Non-blocking
      }
    }
  }

  async logVehicleTelemetry(telemetry) {
    if (this.client) {
      try {
        await this.client.from('vehicle_telemetry').insert({
          vehicle_id: telemetry.vehicleId,
          latitude: telemetry.latitude ?? null,
          longitude: telemetry.longitude ?? null,
          speed_kmh: telemetry.speedKmh ?? null,
          recommended_speed_kmh: telemetry.recommendedSpeedKmh ?? null,
          heading_degrees: telemetry.heading ?? null,
          fuel_percent: telemetry.fuelLevelPercent ?? null,
          engine_temperature_c: telemetry.engineTempCelsius ?? null,
          nearest_vehicle_id: telemetry.nearestVehicleId || null,
          nearest_vehicle_distance_m: telemetry.nearestVehicleDistanceMeters ?? null,
          relative_speed_kmh: telemetry.relativeSpeedKmh ?? null,
          estimated_pitch: telemetry.estimatedPitch ?? null,
          estimated_roll: telemetry.estimatedRoll ?? null,
          risk_score: telemetry.riskScorePercent ?? 0,
          risk_level: telemetry.riskLevel || 'SAFE',
          risk_factors: telemetry.riskFactors || [],
          recommended_action: telemetry.recommendedAction || null,
          source: telemetry.source || 'SIMULATION',
        });
      } catch (err) {
        // Non-blocking
      }
    }
  }

  async logWeatherReading(weather) {
    if (this.client) {
      try {
        await this.client.from('weather_readings').insert({
          site_id: weather.siteId,
          temperature_c: weather.temperatureCelsius,
          humidity_percent: weather.humidityPercent,
          wind_speed_kmh: weather.windSpeedKmh,
          pressure_hpa: weather.pressureHpa,
          visibility_m: weather.visibilityMeters,
          weather_condition: weather.status,
          source: weather.source || 'WEATHER_API',
        });
      } catch (err) {
        // Non-blocking
      }
    }
  }

  getAnalytics(siteId) {
    const criticalCount = this.cache.alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
    const warningCount = this.cache.alerts.filter((a) => a.severity === 'WARNING' || a.severity === 'HIGH').length;

    return {
      safetyScore: Math.max(60, 95 - criticalCount * 12 - warningCount * 3),
      nearMissesCount: Math.max(1, warningCount + criticalCount),
      criticalEventsCount: criticalCount,
      activeVehiclesCount: this.cache.vehicles.length,
      fleetUtilizationPercent: 86.4,
      avgCycleTimeMinutes: 24.5,
      idleTimePercent: 8.2,
      environmentalDowntimeHours: 3.5,
      highRiskZones: [
        { zoneName: 'Pit Bench B-4', riskScore: 78, incidentCount: 1 },
        { zoneName: 'Main Haul Ramp #2', riskScore: 54, incidentCount: 0 },
      ],
      timeSeries: [
        { time: '06:00', safetyScore: 98, nearMisses: 0, criticalAlerts: 0, avgSpeedKmh: 24, visibilityMeters: 25, fleetUtilizationPercent: 90 },
        { time: '07:00', safetyScore: 96, nearMisses: 0, criticalAlerts: 0, avgSpeedKmh: 22, visibilityMeters: 18, fleetUtilizationPercent: 92 },
        { time: '08:00', safetyScore: 89, nearMisses: 1, criticalAlerts: 0, avgSpeedKmh: 19, visibilityMeters: 10, fleetUtilizationPercent: 88 },
        { time: '09:00', safetyScore: 78, nearMisses: 2, criticalAlerts: 1, avgSpeedKmh: 14, visibilityMeters: 4, fleetUtilizationPercent: 75 },
        { time: '10:00', safetyScore: 85, nearMisses: 1, criticalAlerts: 0, avgSpeedKmh: 16, visibilityMeters: 8, fleetUtilizationPercent: 82 },
      ],
    };
  }
}

export const db = new DatabaseService();
