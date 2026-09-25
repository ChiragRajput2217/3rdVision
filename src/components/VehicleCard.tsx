import React from 'react';
import { Vehicle } from '../types';
import { Badge } from './Badge';
import { Truck, MapPin, Gauge, ShieldAlert } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onSelect }) => {
  const { telemetry } = vehicle;
  const isHighRisk = vehicle.status === 'CRITICAL' || vehicle.status === 'HIGH_RISK';

  return (
    <div
      onClick={() => onSelect?.(vehicle)}
      className={`rounded-2xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-4 group bg-white border-stone-200 hover:border-stone-300 ${
        isHighRisk ? 'border-l-4 border-l-red-600' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-amber-700 group-hover:border-amber-300 transition-colors">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-stone-900 text-base leading-tight group-hover:text-amber-800 transition-colors">
                {vehicle.code}
              </h4>
              <span className="text-xs text-stone-500 font-medium">
                ({vehicle.model || vehicle.type})
              </span>
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              {vehicle.driverName || vehicle.operatorName || 'Operator On-Duty'}
            </div>
          </div>
        </div>

        <Badge status={vehicle.status} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
        <div className="space-y-0.5">
          <span className="text-[10px] text-stone-500 flex items-center gap-1 font-medium">
            <Gauge className="w-3 h-3 text-emerald-700" /> Speed / Limit
          </span>
          <div className="font-bold text-stone-900">
            {telemetry.speedKmh} km/h{' '}
            <span className="text-stone-500 text-[10px] font-normal">(Rec: {telemetry.recommendedSpeedKmh})</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-stone-500 flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-amber-700" /> Location
          </span>
          <div className="font-bold text-stone-800 truncate">
            {vehicle.assignedZoneName || vehicle.zoneId || 'Pit Bench B-4'}
          </div>
        </div>
      </div>

      <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-600 flex items-center gap-1 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" /> ML Collision Risk
          </span>
          <span
            className={`font-bold ${
              telemetry.riskScorePercent >= 75
                ? 'text-red-700'
                : telemetry.riskScorePercent >= 45
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            {telemetry.riskScorePercent}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              telemetry.riskScorePercent >= 75
                ? 'bg-red-600'
                : telemetry.riskScorePercent >= 45
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
            style={{ width: `${telemetry.riskScorePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
