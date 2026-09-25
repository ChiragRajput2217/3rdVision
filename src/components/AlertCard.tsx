import React from 'react';
import { Alert } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import { useAppStore } from '../store/appStore';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Truck,
  Compass,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onViewOnMap?: (alert: Alert) => void;
  onInvestigate?: (alert: Alert) => void;
  compact?: boolean;
  readOnly?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onViewOnMap,
  onInvestigate,
  compact = false,
  readOnly = false,
}) => {
  const { acknowledgeAlert, resolveAlert } = useAppStore();

  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH' || alert.severity === 'WARNING';

  return (
    <div
      className={`rounded-2xl bg-white border border-stone-200 p-5 transition-all duration-200 flex flex-col justify-between gap-4 shadow-xs hover:shadow-sm ${
        isCritical
          ? 'border-l-4 border-l-red-600'
          : isHigh
          ? 'border-l-4 border-l-amber-500'
          : 'border-l-4 border-l-stone-600'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isCritical
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-amber-50 text-amber-800 border border-amber-300'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge status={alert.severity} size="sm" />
              <Badge status={alert.status} size="sm" />
            </div>
            <h4 className="font-extrabold text-stone-900 text-base tracking-tight mt-1 leading-snug">
              {alert.title}
            </h4>
          </div>
        </div>

        {/* Risk Score Gauge Badge */}
        <div className="text-right shrink-0">
          <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Risk Score</div>
          <div
            className={`text-2xl font-black tabular-nums ${
              alert.riskScorePercent >= 80
                ? 'text-red-600'
                : alert.riskScorePercent >= 50
                ? 'text-amber-700'
                : 'text-stone-700'
            }`}
          >
            {alert.riskScorePercent}%
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">{alert.description}</p>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-2.5 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
        <div className="space-y-0.5">
          <div className="text-[11px] text-stone-500 font-semibold flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-700" /> Vehicle(s)
          </div>
          <div className="font-bold text-stone-900 truncate">
            {alert.vehicleCode || 'Site Station'}
            {alert.secondaryVehicleCode ? ` ↔ ${alert.secondaryVehicleCode}` : ''}
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[11px] text-stone-500 font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-700" /> Zone
          </div>
          <div className="font-bold text-stone-800 truncate">{alert.zoneName || 'Pit Bench'}</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[11px] text-stone-500 font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-stone-600" /> Sensor Source
          </div>
          <div className="font-bold text-stone-800 truncate">{alert.sensorName || 'ML Telemetry'}</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[11px] text-stone-500 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-500" /> Timestamp
          </div>
          <div className="font-bold text-stone-700 tabular-nums">{new Date(alert.timestamp).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Recommended Action Prompt */}
      <div className="bg-amber-50/80 border border-amber-300 p-3 rounded-xl flex items-start gap-2.5">
        <Flame className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <span className="font-bold text-amber-900 uppercase tracking-wide">Action: </span>
          <span className="font-semibold text-stone-800">{alert.recommendedAction}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {!compact && (
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <Button
                variant="outline"
                size="sm"
                icon={<MapPin className="w-3.5 h-3.5 text-amber-700" />}
                onClick={() => onViewOnMap(alert)}
              >
                View on Map
              </Button>
            )}
            {onInvestigate && (
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                onClick={() => onInvestigate(alert)}
              >
                Investigate
              </Button>
            )}
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              {alert.status === 'ACTIVE' && (
                <>
                  <Button
                    variant="warning"
                    size="sm"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => acknowledgeAlert(alert.id, 'Control Room')}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<AlertOctagon className="w-3.5 h-3.5" />}
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </>
              )}
              {alert.status === 'ACKNOWLEDGED' && (
                <span className="text-xs font-mono text-emerald-700 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Acknowledged by {alert.acknowledgedBy || 'Operator'}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
