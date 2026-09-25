import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface SensorHistoryChartProps {
  data?: { time: string; value: number; benchmark?: number }[];
  title?: string;
  unit?: string;
  color?: string;
}

const DEFAULT_DATA = [
  { time: '08:00', value: 24.5, benchmark: 20 },
  { time: '08:15', value: 22.1, benchmark: 20 },
  { time: '08:30', value: 18.4, benchmark: 20 },
  { time: '08:45', value: 12.0, benchmark: 20 },
  { time: '09:00', value: 4.2, benchmark: 20 },
  { time: '09:15', value: 3.8, benchmark: 20 },
  { time: '09:30', value: 8.5, benchmark: 20 },
  { time: '09:45', value: 14.2, benchmark: 20 },
];

export const SensorHistoryChart: React.FC<SensorHistoryChartProps> = ({
  data = DEFAULT_DATA,
  title = 'Telemetry History (Atmospheric Visibility)',
  unit = 'm',
  color = '#d97706',
}) => {
  const [timeRange, setTimeRange] = useState<'1H' | '6H' | '24H'>('1H');

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-stone-900 text-base tracking-tight">{title}</h4>
          <p className="text-xs text-stone-500 font-medium">Real-time IoT time series stream</p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
          {(['1H', '6H', '24H'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                timeRange === range ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="time" stroke="#a8a29e" tick={{ fontSize: 12, fill: '#57534e' }} />
            <YAxis stroke="#a8a29e" tick={{ fontSize: 12, fill: '#57534e' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e7e5e4',
                borderRadius: '10px',
                color: '#1c1917',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
              }}
              formatter={(val: any) => [`${val} ${unit}`, 'Reading']}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fillOpacity={1} fill="url(#chartGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
