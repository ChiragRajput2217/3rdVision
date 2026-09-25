import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} style={style} />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 font-sans">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-16" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
    <div className="p-4 border-b border-slate-200">
      <Skeleton className="h-6 w-48" />
    </div>
    <div className="p-4 flex gap-4 border-b border-slate-200 bg-slate-50">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[300px] font-sans">
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <div className="flex-1 flex items-end gap-2 px-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="flex-1 rounded-t-sm bg-slate-200" 
          style={{ height: `${25 + ((i * 37) % 65)}%` }} 
        />
      ))}
    </div>
  </div>
);

export const MapSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative h-[400px] flex items-center justify-center font-sans">
    <div className="absolute inset-0 bg-slate-50">
      <div className="absolute inset-0 opacity-20" style={{ 
        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />
    </div>
    <Skeleton className="absolute inset-0 bg-slate-100/40" />
    <div className="z-10 flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
      <span className="text-sm font-mono text-slate-500">Loading Geospatial Terrain...</span>
    </div>
  </div>
);
