import axios from 'axios';
import { config } from './config.js';

class RiskEngine {
  constructor() {
    this.previousScores = new Map(); // vehicleId -> lastScore
  }

  /**
   * Evaluates decision-support risk (proximity, environmental, stability) for a vehicle or hardware node.
   * @param {Object} params
   * @returns {Promise<Object>} Risk evaluation result
   */
  async evaluateRisk(params) {
    const {
      vehicleId = 'veh-d104',
      distanceMeters,
      approachRateMps = 0,
      pitch = 0,
      roll = 0,
      accelMagnitude = 0,
      gyroMagnitude = 0,
      tiltMagnitude = 0,
      accelZ = 9.8,
      speedKmh = 18,
      zoneSpeedLimit = 20,
      visibilityMeters = 25,
      fogLevelPercent = 10,
      humidityPercent = 60,
    } = params;

    const riskFactors = [];
    let baseScore = 10; // Nominal baseline

    // 1. Proximity & Closing Speed Hazard
    if (distanceMeters !== undefined && distanceMeters !== null) {
      if (distanceMeters < 5.0) {
        baseScore += 60;
        riskFactors.push(`Critical obstacle distance: ${distanceMeters.toFixed(1)}m (< 5.0m threshold)`);
      } else if (distanceMeters < 15.0) {
        baseScore += 35;
        riskFactors.push(`Unsafe following headway: ${distanceMeters.toFixed(1)}m`);
      } else if (distanceMeters < 25.0) {
        baseScore += 15;
      }

      // Approach rate (positive means closing in)
      if (approachRateMps > 3.0) {
        baseScore += 20;
        riskFactors.push(`High relative closing velocity (+${(approachRateMps * 3.6).toFixed(1)} km/h)`);
      } else if (approachRateMps > 1.0) {
        baseScore += 10;
      }
    }

    // 2. Atmospheric Visibility & Fog Hazard
    if (visibilityMeters < 4.0 || fogLevelPercent > 75) {
      baseScore += 25;
      riskFactors.push(`Dense Atmospheric Fog (Visibility: ${visibilityMeters.toFixed(1)}m)`);
    } else if (visibilityMeters < 10.0 || fogLevelPercent > 50) {
      baseScore += 15;
      riskFactors.push(`Moderate Fog Hazard (Visibility: ${visibilityMeters.toFixed(1)}m)`);
    }

    // 3. Slope, Gradient & Vehicle Stability (MPU6500)
    const absPitch = Math.abs(pitch);
    const absRoll = Math.abs(roll);
    if (absPitch > 18 || absRoll > 15) {
      baseScore += 30;
      riskFactors.push(`High bench tilt angle detected (Pitch: ${absPitch.toFixed(1)}°, Roll: ${absRoll.toFixed(1)}°)`);
    } else if (absPitch > 12 || absRoll > 10) {
      baseScore += 15;
      riskFactors.push(`Moderate slope gradient`);
    }

    // 4. Overspeeding vs Zone Speed Limit
    if (speedKmh > zoneSpeedLimit) {
      const overspeed = speedKmh - zoneSpeedLimit;
      baseScore += Math.min(25, overspeed * 3);
      riskFactors.push(`Exceeding zone speed limit (${speedKmh} km/h vs ${zoneSpeedLimit} km/h)`);
    }

    // Clamp score to 0 - 100
    let finalScore = Math.min(99, Math.max(5, Math.round(baseScore)));

    // Optional ML Model Refinement
    let modelVersion = 'v1.0-rules';
    let confidence = 0.92;

    if (config.mlService.enabled) {
      try {
        const mlResult = await this.callMlService({
          distanceMeters,
          approachRateMps,
          pitch,
          roll,
          accelMagnitude,
          gyroMagnitude,
          tiltMagnitude,
          speedKmh,
          visibilityMeters,
          humidityPercent,
        });

        if (mlResult && mlResult.riskScore !== undefined) {
          // Weighted blend: 60% ML inference + 40% deterministic safety rules
          finalScore = Math.round(mlResult.riskScore * 0.6 + finalScore * 0.4);
          confidence = mlResult.confidence || 0.95;
          modelVersion = mlResult.modelVersion || 'v2.1-xgb-collision';
          riskFactors.push(`ML Model Prediction: ${mlResult.riskScore}% risk`);
        }
      } catch (err) {
        // Fallback transparently to rule-based score
      }
    }

    // Determine Risk Level
    let riskLevel = 'SAFE';
    let recommendedSpeedKmh = zoneSpeedLimit;
    let recommendedAction = 'NORMAL HAULAGE OPERATIONAL';

    if (finalScore >= 85) {
      riskLevel = 'CRITICAL';
      recommendedSpeedKmh = Math.min(8, Math.round(zoneSpeedLimit * 0.4));
      recommendedAction = `REDUCE SPEED TO ${recommendedSpeedKmh} KM/H IMMEDIATELY — STOP SAFELY IF DISTANCE DECREASES`;
    } else if (finalScore >= 60) {
      riskLevel = 'HIGH_RISK';
      recommendedSpeedKmh = Math.min(10, Math.round(zoneSpeedLimit * 0.5));
      recommendedAction = `SLOW DOWN TO ${recommendedSpeedKmh} KM/H — MAINTAIN INCREASED FOLLOWING DISTANCE`;
    } else if (finalScore >= 35) {
      riskLevel = 'WARNING';
      recommendedSpeedKmh = Math.min(15, Math.round(zoneSpeedLimit * 0.75));
      recommendedAction = `MAINTAIN SAFE FOLLOWING DISTANCE ON RAMP`;
    }

    // Trend calculation
    const prevScore = this.previousScores.get(vehicleId) || finalScore;
    let trend = 'STABLE';
    if (finalScore - prevScore >= 5) trend = 'INCREASING';
    else if (prevScore - finalScore >= 5) trend = 'DECREASING';
    this.previousScores.set(vehicleId, finalScore);

    return {
      riskScore: finalScore,
      riskLevel,
      confidence,
      riskFactors: riskFactors.length > 0 ? riskFactors : ['Standard operational parameters within safe limits'],
      recommendedAction,
      recommendedSpeedKmh,
      trend,
      modelVersion,
    };
  }

  async callMlService(features) {
    const res = await axios.post(config.mlService.url, features, {
      timeout: config.mlService.timeoutMs,
    });
    return res.data;
  }
}

export const riskEngine = new RiskEngine();
