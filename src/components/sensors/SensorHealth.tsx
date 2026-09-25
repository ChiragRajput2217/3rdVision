import React from 'react';
import { SensorHealth as HealthType } from '../../types';
import { Wifi, Battery, ShieldCheck } from 'lucide-react';

interface SensorHealthProps {
  health: HealthType;
}

export const SensorHealth: React.FC<SensorHealthProps> = ({ health }) => {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
      <div className="flex items-center gap-1.5 text-slate-700">
        <Wifi className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-slate-500">Signal:</span>
        <span className="font-bold text-slate-900">{health.signalStrengthDbm} dBm</span>
      </div>

      {health.batteryPercent !== undefined && (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Battery className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500">Batt:</span>
          <span className="font-bold text-slate-900">{health.batteryPercent}%</span>
        </div>
      )}

      {health.pointCloudHealthPercent !== undefined && (
        <div className="flex items-center gap-1.5 text-slate-700 col-span-2">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-slate-500">Point-Cloud Health:</span>
          <span className={`font-bold ${health.pointCloudHealthPercent < 70 ? 'text-amber-600' : 'text-emerald-700'}`}>
            {health.pointCloudHealthPercent}%
          </span>
        </div>
      )}
    </div>
  );
};
