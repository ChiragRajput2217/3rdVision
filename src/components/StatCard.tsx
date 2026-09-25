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
  const iconStyleMap = {
    emerald: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-900 bg-amber-50 border-amber-300',
    orange: 'text-orange-900 bg-orange-50 border-orange-200',
    red: 'text-red-800 bg-red-50 border-red-200',
    blue: 'text-stone-800 bg-stone-100 border-stone-200',
    purple: 'text-purple-800 bg-purple-50 border-purple-200',
  }[statusColor];

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-white shadow-xs transition-all duration-200 hover:shadow-sm hover:border-stone-300">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-bold text-stone-600 leading-tight">{label}</span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconStyleMap}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-xs sm:text-sm text-stone-500 font-semibold">{unit}</span>}
      </div>

      {(trend || subtext) && (
        <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs gap-2">
          {trend && (
            <span className={`font-semibold shrink-0 ${trend.isPositive ? 'text-emerald-700' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtext && <span className="text-stone-500 truncate font-medium">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
