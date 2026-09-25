import React from 'react';
import { Vehicle } from '../../types';
import { AlertTriangle, ShieldCheck, Gauge, Eye, Truck, Flame } from 'lucide-react';
import { Button } from '../ui/Button';

interface VehicleOperatorGaugeProps {
  vehicle: Vehicle;
  visibilityMeters: number;
  onAcknowledgeAlert?: () => void;
}

export const VehicleOperatorGauge: React.FC<VehicleOperatorGaugeProps> = ({
  vehicle,
  visibilityMeters,
  onAcknowledgeAlert,
}) => {
  const { telemetry } = vehicle;
  const isCritical = vehicle.status === 'CRITICAL';
  const isWarning = vehicle.status === 'WARNING' || vehicle.status === 'HIGH_RISK';

  const speedExceeded = telemetry.speedKmh > telemetry.recommendedSpeedKmh;

  return (
    <div className="space-y-6">
      {/* Dynamic Caution Banner */}
      <div
        className={`p-6 rounded-3xl border text-center shadow-sm transition-all duration-300 ${
          isCritical
            ? 'bg-red-50 border-red-300 animate-pulse'
            : isWarning
            ? 'bg-amber-50 border-amber-300'
            : 'bg-emerald-50 border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-sm font-mono font-extrabold uppercase tracking-widest">
          {isCritical ? (
            <>
              <AlertTriangle className="w-6 h-6 text-red-700 stroke-[3]" />
              <span className="text-red-800 font-black">CRITICAL SAFETY ALERT</span>
            </>
          ) : isWarning ? (
            <>
              <AlertTriangle className="w-6 h-6 text-amber-700 stroke-[3]" />
              <span className="text-amber-800 font-black">CAUTION ADVISORY</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-6 h-6 text-emerald-700 stroke-[3]" />
              <span className="text-emerald-800 font-black">NORMAL SAFE SPEED</span>
            </>
          )}
        </div>

        <div className="mt-2 text-base sm:text-lg font-bold text-stone-900 font-mono tracking-tight uppercase">
          {telemetry.recommendedAction}
        </div>
      </div>

      {/* Speed & Proximity Large Gauge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        
        {/* Speedometer Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-xs relative overflow-hidden">
          <div className="text-[11px] sm:text-xs font-mono text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-600" /> Current Vehicle Speed
          </div>

          <div className="flex items-baseline justify-center gap-1.5 my-1.5">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${
                speedExceeded ? 'text-red-600 animate-pulse' : 'text-stone-900'
              }`}
            >
              {telemetry.speedKmh}
            </span>
            <span className="text-xs font-mono text-stone-500 font-medium">KM/H</span>
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-stone-200 w-full flex items-center justify-around text-xs font-mono">
            <div>
              <div className="text-stone-500 text-[10px] sm:text-[11px]">Recommended Speed</div>
              <div className="text-sm sm:text-base font-bold text-amber-700">{telemetry.recommendedSpeedKmh} KM/H</div>
            </div>
            <div className="h-5 w-px bg-stone-200" />
            <div>
              <div className="text-stone-500 text-[10px] sm:text-[11px]">Speed Status</div>
              <div className={`text-[11px] sm:text-xs font-bold ${speedExceeded ? 'text-red-700' : 'text-emerald-700'}`}>
                {speedExceeded ? 'OVERSPEED' : 'SAFE COMPLIANCE'}
              </div>
            </div>
          </div>
        </div>

        {/* Proximity & Visibility Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs space-y-3">
          
          {/* Nearest Vehicle Proximity */}
          <div>
            <div className="text-[11px] sm:text-xs font-mono text-stone-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Truck className="w-3.5 h-3.5 text-stone-600" /> Nearest Vehicle Proximity
            </div>
            {telemetry.nearestVehicleDistanceMeters != null ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-bold font-mono ${
                      telemetry.nearestVehicleDistanceMeters < 10 ? 'text-red-600' : 'text-amber-700'
                    }`}
                  >
                    {telemetry.nearestVehicleDistanceMeters}m
                  </span>
                  <span className="text-xs font-mono text-stone-600 font-semibold">
                    ({telemetry.nearestVehicleName || 'D-108'})
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                  Closing Velocity:{' '}
                  <span className="font-mono font-bold text-stone-800">
                    {telemetry.relativeSpeedKmh} km/h
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm font-bold text-emerald-700">No Vehicle within 100m</div>
            )}
          </div>

          {/* Visibility & Risk Score */}
          <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-stone-200 text-xs font-mono">
            <div className="bg-stone-50 p-2.5 sm:p-3 rounded-lg border border-stone-200">
              <div className="text-[10px] sm:text-[11px] text-stone-600 flex items-center gap-1 font-medium">
                <Eye className="w-3.5 h-3.5 text-amber-700" /> Optical Visibility
              </div>
              <div className="text-base sm:text-lg font-bold text-stone-900 mt-0.5">{visibilityMeters}m</div>
            </div>

            <div className="bg-stone-50 p-2.5 sm:p-3 rounded-lg border border-stone-200">
              <div className="text-[10px] sm:text-[11px] text-stone-600 flex items-center gap-1 font-medium">
                <Flame className="w-3.5 h-3.5 text-red-600" /> Risk Score
              </div>
              <div className="text-base sm:text-lg font-bold text-red-600 mt-0.5">{telemetry.riskScorePercent}%</div>
            </div>
          </div>

        </div>

      </div>

      {/* Large Touch Acknowledge Button */}
      {isCritical && onAcknowledgeAlert && (
        <Button
          variant="primary"
          size="lg"
          className="w-full py-6 text-xl tracking-wider uppercase font-black bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer"
          onClick={onAcknowledgeAlert}
        >
          ✓ ACKNOWLEDGE & REDUCE SPEED NOW
        </Button>
      )}
    </div>
  );
};
