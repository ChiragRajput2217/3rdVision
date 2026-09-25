import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="w-full py-12 px-6 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 shadow-sm font-sans">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-3 border border-slate-200">
        {icon || <ShieldCheck className="w-6 h-6 text-emerald-600" />}
      </div>
      <h4 className="text-base font-bold text-slate-900">{title}</h4>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
