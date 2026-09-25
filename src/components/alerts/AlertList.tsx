import React, { useState } from 'react';
import { Alert, AlertSeverity, AlertStatus } from '../../types';
import { AlertCard } from './AlertCard';
import { EmptyState } from '../ui/EmptyState';
import { ShieldCheck, Filter } from 'lucide-react';

interface AlertListProps {
  alerts: Alert[];
  onViewOnMap?: (alert: Alert) => void;
  onInvestigate?: (alert: Alert) => void;
}

export const AlertList: React.FC<AlertListProps> = ({ alerts, onViewOnMap, onInvestigate }) => {
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-stone-200 text-xs shadow-xs">
        <div className="flex items-center gap-2 text-stone-600 font-medium">
          <Filter className="w-3.5 h-3.5 text-amber-700" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-800 rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="WARNING">Warning Only</option>
            <option value="INFO">Info Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-800 rounded-lg px-2.5 py-1 text-xs outline-none cursor-pointer font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Alert List Container */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No Active Alerts"
          description="All mine operations are running within safe parameters."
          icon={<ShieldCheck className="w-8 h-8 text-emerald-400" />}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onViewOnMap={onViewOnMap}
              onInvestigate={onInvestigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
