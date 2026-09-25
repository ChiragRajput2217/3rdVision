import React from 'react';
import { Sensor } from '../../types';
import { SensorStatus } from './SensorStatus';
import { SensorHealth } from './SensorHealth';
import { SensorDirection } from './SensorDirection';
import { SensorReading } from './SensorReading';
import { Cpu, Truck, Clock, Info } from 'lucide-react';

interface SensorCardProps {
  sensor: Sensor;
  onSelect?: (sensor: Sensor) => void;
}

export const SensorCard: React.FC<SensorCardProps> = ({ sensor, onSelect }) => {
  return (
    <div
      onClick={() => onSelect?.(sensor)}
      className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer group"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-blue-600 group-hover:border-blue-300 transition-colors">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
              {sensor.name}
            </h4>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-1">
              <span>ID: {sensor.id}</span>
              {sensor.vehicleCode && (
                <span className="flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Truck className="w-3 h-3" /> {sensor.vehicleCode}
                </span>
              )}
            </div>
          </div>
        </div>

        <SensorStatus status={sensor.status} />
      </div>

      {/* Purpose Explanation */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>{sensor.purpose}</span>
      </div>

      {/* Telemetry Readings */}
      <SensorReading sensor={sensor} />

      {/* Health & Direction Grid */}
      <div className="space-y-2">
        <SensorDirection angleDegrees={sensor.directionAngle} detectionRangeMeters={sensor.detectionRangeMeters} />
        <SensorHealth health={sensor.health} />
      </div>

      {/* Footer Timestamp */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> Updated {new Date(sensor.lastUpdate).toLocaleTimeString()}
        </span>
        <span className="text-blue-600 font-semibold hover:underline">View Historical Telemetry →</span>
      </div>
    </div>
  );
};
