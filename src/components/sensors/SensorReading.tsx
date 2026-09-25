import React from 'react';
import { Sensor } from '../../types';
import { Radio, Eye, Navigation, CloudFog } from 'lucide-react';

interface SensorReadingProps {
  sensor: Sensor;
}

export const SensorReading: React.FC<SensorReadingProps> = ({ sensor }) => {
  const { type, telemetry } = sensor;

  if (type === 'RADAR' && telemetry.radar) {
    const { distanceMeters, relativeSpeedKmh, objectsDetectedCount, detectionRangeMeters } = telemetry.radar;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-bold uppercase">
          <Radio className="w-4 h-4" /> 77GHz Radar Telemetry
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Distance</div>
            <div className="text-xl font-extrabold text-slate-900">{distanceMeters}m</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Relative Closing Speed</div>
            <div className={`text-xl font-extrabold ${relativeSpeedKmh > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {relativeSpeedKmh > 0 ? `+${relativeSpeedKmh}` : relativeSpeedKmh} km/h
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Objects Detected</div>
            <div className="text-base font-bold text-blue-600">{objectsDetectedCount} Tracked</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Detection Range</div>
            <div className="text-base font-bold text-slate-800">{detectionRangeMeters}m Max</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'LIDAR' && telemetry.lidar) {
    const { objectsDetectedCount, scanRangeMeters, nearestObjectDistanceMeters, pointCloudHealthPercent } = telemetry.lidar;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-700 font-bold uppercase">
          <Eye className="w-4 h-4" /> 3D LiDAR Point-Cloud Telemetry
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Nearest Object</div>
            <div className="text-xl font-extrabold text-slate-900">{nearestObjectDistanceMeters}m</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Scan Range</div>
            <div className="text-xl font-extrabold text-purple-700">{scanRangeMeters}m</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Objects Identified</div>
            <div className="text-base font-bold text-blue-600">{objectsDetectedCount} Targets</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Cloud Quality</div>
            <div className="text-base font-bold text-emerald-700">{pointCloudHealthPercent}%</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'GPS' && telemetry.gps) {
    const { latitude, longitude, speedKmh, headingDegrees, accuracyMeters } = telemetry.gps;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-bold uppercase">
          <Navigation className="w-4 h-4" /> RTK-DGPS Satellite Telemetry
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 col-span-2">
            <div className="text-[10px] text-slate-500">Coordinates (Lat / Lng)</div>
            <div className="text-sm font-extrabold text-slate-900">{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Telemetry Speed</div>
            <div className="text-xl font-extrabold text-emerald-700">{speedKmh} km/h</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Heading & Accuracy</div>
            <div className="text-sm font-bold text-slate-800">{headingDegrees}° (±{accuracyMeters * 100}cm)</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'VISIBILITY' && telemetry.visibility) {
    const { visibilityMeters, fogLevelPercent, humidityPercent, status } = telemetry.visibility;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-800 font-bold uppercase">
          <CloudFog className="w-4 h-4" /> Transmissometer Fog Telemetry
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Optical Visibility</div>
            <div className={`text-xl font-extrabold ${visibilityMeters < 5 ? 'text-red-600' : 'text-emerald-700'}`}>
              {visibilityMeters}m
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Fog Obscuration</div>
            <div className="text-xl font-extrabold text-amber-600">{fogLevelPercent}%</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Humidity</div>
            <div className="text-base font-bold text-slate-700">{humidityPercent}%</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Hazard State</div>
            <div className="text-base font-bold text-red-600 uppercase">{status}</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'HC_SR04' || (type as string) === 'HC-SR04' || telemetry.distanceMeters !== undefined) {
    const distM = telemetry.distanceMeters ?? telemetry.radar?.distanceMeters ?? null;
    const distCm = telemetry.distanceCm ?? (distM !== null ? parseFloat((distM * 100).toFixed(1)) : null);
    const approach = telemetry.approachRateMps ?? (telemetry.radar?.relativeSpeedKmh ? telemetry.radar.relativeSpeedKmh / 3.6 : 0);
    const isDetected = telemetry.objectDetected ?? (distM !== null && distM < (sensor.detectionRangeMeters || 4.0));

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-bold uppercase">
          <Radio className="w-4 h-4" /> HC-SR04 Ultrasonic Telemetry
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Object Distance</div>
            <div className="text-xl font-extrabold text-slate-900">
              {distM !== null ? `${distM}m` : 'N/A'}
            </div>
            {distCm !== null && <div className="text-[10px] text-slate-400">({distCm} cm)</div>}
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Approach Rate</div>
            <div className={`text-xl font-extrabold ${approach > 0.05 ? 'text-red-600' : 'text-emerald-700'}`}>
              {approach > 0 ? `+${approach.toFixed(2)}` : approach.toFixed(2)} m/s
            </div>
            <div className="text-[10px] text-slate-400">({(approach * 3.6).toFixed(1)} km/h)</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Obstacle State</div>
            <div className={`text-base font-bold ${isDetected ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isDetected ? 'TARGET IN FOV' : 'CLEAR'}
            </div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Sensor Range</div>
            <div className="text-base font-bold text-slate-800">{sensor.detectionRangeMeters || 4.0}m Max</div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'MPU6500' || telemetry.accelX !== undefined || telemetry.estimatedPitch !== undefined) {
    const ax = telemetry.accelX ?? 0;
    const ay = telemetry.accelY ?? 0;
    const az = telemetry.accelZ ?? 9.8;
    const pitch = telemetry.estimatedPitch ?? 0;
    const roll = telemetry.estimatedRoll ?? 0;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 font-bold uppercase">
          <Navigation className="w-4 h-4" /> MPU6500 6-Axis Motion Telemetry
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Estimated Pitch</div>
            <div className="text-xl font-extrabold text-slate-900">{pitch !== null ? `${pitch}°` : 'N/A'}</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500">Estimated Roll</div>
            <div className="text-xl font-extrabold text-slate-900">{roll !== null ? `${roll}°` : 'N/A'}</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 col-span-2">
            <div className="text-[10px] text-slate-500">3-Axis Acceleration (g)</div>
            <div className="text-xs font-bold text-slate-800">
              X: {ax.toFixed(2)} | Y: {ay.toFixed(2)} | Z: {az.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-500">
      Telemetry active • Processing telemetry stream...
    </div>
  );
};
