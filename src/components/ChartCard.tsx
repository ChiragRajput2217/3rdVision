import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  height = 300,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ height: typeof height === 'number' ? `${height}px` : height }} className="w-full">
        {children}
      </div>
    </div>
  );
};
