import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSiteStore } from '../../../store/siteStore';
import { useVehicles } from '../../../hooks/useVehicles';
import { useAlertStore } from '../../../store/alertStore';
import {
  Truck,
  Gauge,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Radio,
} from 'lucide-react';

export const VehicleOperatorDashboard: React.FC = () => {
  const { user, selectedSiteId } = useAuth();
  const { selectedSite } = useSiteStore();
  const { vehicles } = useVehicles(selectedSite.id || selectedSiteId);
  const { acknowledgeAlert, alerts } = useAlertStore();

  const [acknowledged, setAcknowledged] = useState(false);

  // Find operator's assigned vehicle (D-104 preferred, then first available)
  const operatorVehicle =
    vehicles.find((v) => v.code === 'D-104') || vehicles[0] || null;

  const currentSpeed = operatorVehicle?.telemetry?.speedKmh ?? null;
  const recommendedSpeed = operatorVehicle?.telemetry?.recommendedSpeedKmh ?? null;
  const visibility = selectedSite.currentCondition?.visibilityMeters ?? null;
  const nearestVehicleDistance =
    operatorVehicle?.telemetry?.nearestVehicleDistanceMeters ?? null;

  // Active warning banner determination (only when real data is present)
  const isOverSpeed = currentSpeed !== null && recommendedSpeed !== null && currentSpeed > recommendedSpeed;
  const isLowVisibility = visibility !== null && visibility < 10;
  const isCollisionRisk = nearestVehicleDistance !== null && nearestVehicleDistance < 20;

  let warningTitle = 'ALL SYSTEMS NORMAL';
  let warningInstruction = 'Maintain safe headway & standard speed';
  let warningSeverity: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';

  if (isCollisionRisk) {
    warningTitle = 'CRITICAL PROXIMITY ALERT';
    warningInstruction = 'Vehicle Ahead in Blind Spot • Brake Immediately';
    warningSeverity = 'CRITICAL';
  } else if (isLowVisibility || isOverSpeed) {
    warningTitle = 'LOW VISIBILITY';
    warningInstruction = 'Reduce Speed';
    warningSeverity = 'WARNING';
  }

  const handleAcknowledge = () => {
    setAcknowledged(true);
    const activeAlert = alerts.find(
      (a) => a.vehicleCode === operatorVehicle.code && a.status === 'ACTIVE'
    );
    if (activeAlert) {
      acknowledgeAlert(activeAlert.id, user?.displayName || 'Driver D-104');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-4 px-1 sm:px-4 space-y-3.5 sm:space-y-4 font-sans select-none">
      
      {/* ─── Vehicle Header Identifier ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
            <Truck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-slate-500">
              In-Cab Driver Interface
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-mono">
              {operatorVehicle ? `Vehicle ${operatorVehicle.code}` : 'No vehicle assigned'}
            </div>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-[10px] sm:text-xs text-slate-500">Zone</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-900">{operatorVehicle?.assignedZoneName ?? 'N/A'}</div>
          <div className="text-[10px] text-slate-500 hidden xs:block">{selectedSite.name}</div>
        </div>
      </div>

      {/* ─── Warning Banner ─── */}
      <div
        className={`rounded-xl p-3 sm:p-4 border transition-all shadow-2xs ${
          warningSeverity === 'CRITICAL'
            ? 'bg-red-50 border-red-500 text-slate-900'
            : warningSeverity === 'WARNING'
            ? 'bg-blue-50 border-blue-500 text-slate-900'
            : 'bg-emerald-50 border-emerald-500 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
              <AlertTriangle
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${
                  warningSeverity === 'CRITICAL'
                    ? 'text-red-600 animate-bounce'
                    : warningSeverity === 'WARNING'
                    ? 'text-blue-600'
                    : 'text-emerald-600'
                }`}
              />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
                {warningTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-700">
              {warningInstruction}
            </p>
          </div>

          <button
            onClick={handleAcknowledge}
            disabled={acknowledged}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 shadow-2xs cursor-pointer ${
              acknowledged
                ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200'
                : warningSeverity === 'CRITICAL'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {acknowledged ? '✓ Acknowledged' : 'Acknowledge'}
          </button>
        </div>
      </div>

      {/* ─── 4 Large Metrics Display ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 font-mono">
        {/* Speed */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Speed</span>
            <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {currentSpeed !== null ? currentSpeed : 'N/A'}
            {currentSpeed !== null && <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1">km/h</span>}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500">Current road speed</div>
        </div>

        {/* Recommended Speed */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Recommended</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 tracking-tight">
            {recommendedSpeed !== null ? recommendedSpeed : 'N/A'}
            {recommendedSpeed !== null && <span className="text-xs sm:text-sm font-normal text-blue-600/70 ml-1">km/h</span>}
          </div>
          <div className="text-[10px] sm:text-xs text-blue-700 font-semibold truncate">Computed safe limit</div>
        </div>

        {/* Visibility */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Visibility</span>
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {visibility !== null ? visibility : 'N/A'}
            {visibility !== null && <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1">m</span>}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 truncate">Site environmental sensor</div>
        </div>

        {/* Nearest Vehicle */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Nearest Vehicle</span>
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              nearestVehicleDistance !== null && nearestVehicleDistance < 15 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {nearestVehicleDistance !== null ? `${Number(nearestVehicleDistance).toFixed(1)}` : 'N/A'}
            {nearestVehicleDistance !== null && <span className="text-xs sm:text-sm font-normal text-slate-400 ml-1">m</span>}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 truncate">
            HC-SR04 ultrasonic distance
          </div>
        </div>
      </div>

      {/* ─── Minimal Telemetry Bar ─── */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs font-mono text-slate-500 shadow-2xs gap-1 sm:gap-0">
        <span className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          V2X Radar Proximity & RTK GPS Active
        </span>
        <span className="text-[10px] sm:text-[11px]">Last update: Just now</span>
      </div>

    </div>
  );
};
