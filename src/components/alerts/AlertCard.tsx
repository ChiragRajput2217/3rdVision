import React from 'react';
import { Alert } from '../../types';
import { AlertBadge } from './AlertBadge';
import { Button } from '../ui/Button';
import { useAlertStore } from '../../store/alertStore';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Truck,
  Compass,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onViewOnMap?: (alert: Alert) => void;
  onInvestigate?: (alert: Alert) => void;
  compact?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onViewOnMap,
  onInvestigate,
  compact = false,
}) => {
  const { acknowledgeAlert, escalateAlert } = useAlertStore();

  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH' || alert.severity === 'WARNING';

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200 p-5 transition-all duration-200 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md ${
        isCritical
          ? 'border-l-4 border-l-red-600'
          : isHigh
          ? 'border-l-4 border-l-amber-500'
          : 'border-l-4 border-l-blue-600'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isCritical
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <AlertBadge severity={alert.severity} size="sm" />
              <AlertBadge status={alert.status} size="sm" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base tracking-tight mt-1 leading-snug">
              {alert.title}
            </h4>
          </div>
        </div>

        {/* Risk Score Gauge Badge */}
        <div className="text-right shrink-0 font-mono">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Risk Score</div>
          <div
            className={`text-2xl font-extrabold ${
              alert.riskScorePercent >= 80
                ? 'text-red-600'
                : alert.riskScorePercent >= 50
                ? 'text-amber-600'
                : 'text-blue-600'
            }`}
          >
            {alert.riskScorePercent}%
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 leading-relaxed font-sans">{alert.description}</p>

      {/* Metadata Grid: Who/What Affected, Where, Source, When */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
        {/* Affected Vehicles */}
        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-600" /> Vehicle(s)
          </div>
          <div className="font-bold text-slate-900 truncate">
            {alert.vehicleCode || 'Site Station'}
            {alert.secondaryVehicleCode ? ` ↔ ${alert.secondaryVehicleCode}` : ''}
          </div>
        </div>

        {/* Zone */}
        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600" /> Location / Zone
          </div>
          <div className="font-bold text-slate-800 truncate">{alert.zoneName || 'Pit Bench'}</div>
        </div>

        {/* Sensor Source */}
        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-purple-600" /> Sensor Source
          </div>
          <div className="font-bold text-slate-800 truncate">{alert.sensorName || 'ML Telemetry'}</div>
        </div>

        {/* Time */}
        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> Timestamp
          </div>
          <div className="font-bold text-slate-700">{new Date(alert.timestamp).toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Recommended Action Prompt */}
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2.5">
        <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-amber-900 uppercase tracking-wider font-mono">Recommended Action: </span>
          <span className="font-semibold text-slate-800">{alert.recommendedAction}</span>
        </div>
      </div>

      {/* Action Buttons: Investigate, View on Map, Acknowledge, Escalate */}
      {!compact && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <Button
                variant="outline"
                size="sm"
                icon={<MapPin className="w-3.5 h-3.5 text-blue-600" />}
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
                  onClick={() => escalateAlert(alert.id)}
                >
                  Escalate
                </Button>
              </>
            )}
            {alert.status === 'ACKNOWLEDGED' && (
              <span className="text-xs font-mono text-emerald-700 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Acknowledged by {alert.acknowledgedBy || 'Operator'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
