import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  statusColor?: 'emerald' | 'amber' | 'orange' | 'red' | 'blue' | 'purple';
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon,
  trend,
  statusColor = 'blue',
  subtext,
}) => {
  const iconColor = {
    emerald: 'text-emerald-600',
    amber: 'text-blue-600',
    orange: 'text-blue-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    purple: 'text-indigo-600',
  }[statusColor];

  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <div className={iconColor}>{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{value}</span>
        {unit && <span className="text-xs font-mono text-slate-400 font-semibold">{unit}</span>}
      </div>

      {(trend || subtext) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
          {trend && (
            <span className={`font-mono font-semibold ${trend.isPositive ? 'text-emerald-700' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtext && <span className="text-slate-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
