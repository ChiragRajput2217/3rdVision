import { db } from './database.js';

class AlertManager {
  constructor() {
    this.io = null;
    this.recentAlertsCooldown = new Map(); // key -> timestamp
    this.cooldownPeriodMs = 30000; // 30 seconds
  }

  setSocketIO(io) {
    this.io = io;
  }

  /**
   * Generates or updates alerts based on risk assessment.
   */
  async processRiskAssessment(vehicle, riskAssessment, { persist = true } = {}) {
    if (!vehicle || !riskAssessment) return null;

    const { riskScore, riskLevel, riskFactors, recommendedAction } = riskAssessment;

    // Only create alert if severity is WARNING or higher
    if (riskLevel === 'SAFE') return null;

    let severity = 'WARNING';
    if (riskLevel === 'CRITICAL') severity = 'CRITICAL';
    else if (riskLevel === 'HIGH_RISK') severity = 'HIGH';

    const category = riskFactors.some((f) => f.includes('Fog') || f.includes('Visibility'))
      ? 'VISIBILITY_HAZARD'
      : riskFactors.some((f) => f.includes('tilt') || f.includes('slope'))
      ? 'ENVIRONMENTAL'
      : riskFactors.some((f) => f.includes('speed'))
      ? 'OVERSPEED'
      : 'COLLISION_RISK';

    const cooldownKey = `${vehicle.id}:${category}`;
    const lastTriggered = this.recentAlertsCooldown.get(cooldownKey) || 0;
    const now = Date.now();

    // Cooldown logic:
    // - CRITICAL alerts: 60s cooldown (prevents alert flooding on sustained events)
    // - WARNING/HIGH alerts: 30s cooldown
    // CRITICAL was previously bypassed (0ms) causing dozens of duplicate alerts per sim cycle.
    const effectiveCooldownMs = severity === 'CRITICAL' ? 60000 : this.cooldownPeriodMs;
    if (now - lastTriggered < effectiveCooldownMs) {
      return null;
    }

    this.recentAlertsCooldown.set(cooldownKey, now);

    const alertId = `alt-${category.toLowerCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;
    const newAlert = {
      id: alertId,
      siteId: vehicle.siteId || 'site-kirandul-01',
      category,
      severity,
      status: 'ACTIVE',
      title:
        severity === 'CRITICAL'
          ? `Imminent Collision / Hazard Risk (${vehicle.code})`
          : `Operational Warning: ${category.replace('_', ' ')} (${vehicle.code})`,
      description: riskFactors.join(' • '),
      vehicleId: vehicle.id,
      vehicleCode: vehicle.code,
      secondaryVehicleId: vehicle.telemetry?.nearestVehicleId || null,
      secondaryVehicleCode: vehicle.telemetry?.nearestVehicleName || null,
      sensorId: vehicle.sensorsAttached?.[0] || 'sns-hcsr04-01',
      zoneId: vehicle.zoneId || 'zone-b4',
      zoneName: 'Pit Bench B-4',
      currentValue: `Risk: ${riskScore}% | Distance: ${vehicle.telemetry?.nearestVehicleDistanceMeters ?? 'N/A'}m`,
      riskScorePercent: riskScore,
      recommendedAction,
      timestamp: new Date().toISOString(),
    };

    // Save to database only if persist=true (real hardware); transient simulation alerts are skipped
    if (persist) {
      await db.saveAlert(newAlert);
    }

    // Emit live via Socket.IO
    if (this.io) {
      this.io.emit('alert:created', newAlert);
      this.io.emit('alert:new', newAlert); // compatibility alias
    }

    return newAlert;
  }

  async acknowledgeAlert(alertId, acknowledgedBy) {
    const updated = await db.acknowledgeAlert(alertId, acknowledgedBy);
    if (updated && this.io) {
      this.io.emit('alert:updated', updated);
      this.io.emit('alert:update', updated);
    }
    return updated;
  }

  async resolveAlert(alertId) {
    const updated = await db.resolveAlert(alertId);
    if (updated && this.io) {
      this.io.emit('alert:updated', updated);
      this.io.emit('alert:update', updated);
    }
    return updated;
  }
}

export const alertManager = new AlertManager();
