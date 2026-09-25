import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
  bordered = true,
}) => {
  return (
    <div
      className={`bg-white rounded-2xl ${
        bordered ? 'border border-slate-200 shadow-sm' : ''
      } overflow-hidden flex flex-col transition-all duration-200 ${className}`}
    >
      {(title || action) && (
        <div
          className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 className="font-bold text-slate-900 text-base tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 flex-1">{children}</div>
    </div>
  );
};
