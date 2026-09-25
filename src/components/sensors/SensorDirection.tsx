import React from 'react';
import { Compass } from 'lucide-react';

interface SensorDirectionProps {
  angleDegrees?: number;
  detectionRangeMeters?: number;
}

export const SensorDirection: React.FC<SensorDirectionProps> = ({
  angleDegrees = 0,
  detectionRangeMeters = 4,
}) => {
  const getDirectionLabel = (deg: number) => {
    if (deg === 0) return 'Front (Forward FOV)';
    if (deg === 90) return 'Right Flank';
    if (deg === 180) return 'Rear (Reverse FOV)';
    if (deg === 270) return 'Left Flank';
    return `${deg}° Angle`;
  };

  return (
    <div className="flex items-center justify-between text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
      <div className="flex items-center gap-1.5">
        <Compass className="w-4 h-4 text-blue-600" />
        <span className="text-slate-500">Facing:</span>
        <span className="font-bold text-slate-900">{getDirectionLabel(angleDegrees)}</span>
      </div>
      <div className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
        FOV: {detectionRangeMeters}m
      </div>
    </div>
  );
};
