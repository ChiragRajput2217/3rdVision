import React from 'react';
import { SensorStatus as StatusType } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Wrench } from 'lucide-react';

interface SensorStatusProps {
  status: StatusType;
}

export const SensorStatus: React.FC<SensorStatusProps> = ({ status }) => {
  const map = {
    ONLINE: {
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: 'ONLINE',
    },
    DEGRADED: {
      color: 'text-amber-800 bg-amber-50 border-amber-200',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'DEGRADED',
    },
    OFFLINE: {
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'OFFLINE',
    },
    FAULT: {
      color: 'text-red-700 bg-red-50 border-red-200',
      icon: <Wrench className="w-3.5 h-3.5 animate-bounce" />,
      label: 'FAULT',
    },
  }[status] || {
    color: 'text-slate-600 bg-slate-100 border-slate-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: status,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold uppercase ${map.color}`}>
      {map.icon}
      <span>{map.label}</span>
    </span>
  );
};
