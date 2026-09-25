import React from 'react';
import { AlertSeverity, VehicleStatus, SensorStatus } from '../types';
import { SEVERITY_CONFIG } from '../app/constants';
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface BadgeProps {
  status: AlertSeverity | VehicleStatus | SensorStatus | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
}) => {
  const config = SEVERITY_CONFIG[status as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG['INFO'];
  const textLabel = label || status;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-mono font-bold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-mono font-bold',
  }[size];

  const renderIcon = () => {
    if (!showIcon) return null;
    switch (status) {
      case 'CRITICAL':
        return <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />;
      case 'HIGH':
      case 'HIGH_RISK':
      case 'WARNING':
        return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'SAFE':
      case 'NORMAL':
      case 'ONLINE':
        return <CheckCircle className="w-3.5 h-3.5" />;
      default:
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border uppercase tracking-wider font-semibold shadow-sm ${config.badge} ${sizeClasses}`}
    >
      {renderIcon()}
      <span>{textLabel}</span>
    </span>
  );
};
