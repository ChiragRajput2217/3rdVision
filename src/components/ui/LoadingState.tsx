import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  height?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading mine telemetry...',
  height = 'h-48',
}) => {
  return (
    <div className={`w-full ${height} flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm`}>
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <span className="text-xs font-mono text-slate-500 animate-pulse">{message}</span>
    </div>
  );
};
