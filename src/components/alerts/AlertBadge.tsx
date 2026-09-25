import React from 'react';
import { AlertSeverity, AlertStatus } from '../../types';
import { Badge } from '../ui/Badge';

interface AlertBadgeProps {
  severity?: AlertSeverity;
  status?: AlertStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ severity, status, size = 'md' }) => {
  if (severity) {
    return <Badge status={severity} size={size} />;
  }
  if (status) {
    const statusMap = {
      ACTIVE: 'bg-red-50 text-red-700 border-red-200',
      ACKNOWLEDGED: 'bg-amber-50 text-amber-800 border-amber-200',
      RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      ESCALATED: 'bg-purple-50 text-purple-700 border-purple-200',
    }[status] || 'bg-slate-100 text-slate-700 border-slate-200';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-mono font-bold uppercase ${statusMap}`}>
        {status}
      </span>
    );
  }
  return null;
};
