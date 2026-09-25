import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface RiskTrendChartProps {
  data?: any[];
}

const DEFAULT_RISK_DATA = [
  { time: '06:00', siteRisk: 12, vehicleRisk: 15, fogLevel: 10 },
  { time: '07:00', siteRisk: 22, vehicleRisk: 28, fogLevel: 25 },
  { time: '08:00', siteRisk: 45, vehicleRisk: 54, fogLevel: 55 },
  { time: '09:00', siteRisk: 88, vehicleRisk: 91, fogLevel: 78 },
  { time: '10:00', siteRisk: 62, vehicleRisk: 48, fogLevel: 45 },
  { time: '11:00', siteRisk: 34, vehicleRisk: 25, fogLevel: 20 },
  { time: '12:00', siteRisk: 18, vehicleRisk: 14, fogLevel: 10 },
];

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data = DEFAULT_RISK_DATA }) => {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4 font-sans">
      <div>
        <h4 className="font-bold text-stone-900 text-base tracking-tight">Collision & Weather Risk Trend</h4>
        <p className="text-xs text-stone-500 font-medium">Predictive probability vs atmospheric fog density</p>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="time" stroke="#a8a29e" tick={{ fontSize: 12, fill: '#57534e' }} />
            <YAxis stroke="#a8a29e" tick={{ fontSize: 12, fill: '#57534e' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e7e5e4',
                borderRadius: '10px',
                color: '#1c1917',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Line type="monotone" dataKey="vehicleRisk" name="D-104 Risk Score (%)" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="siteRisk" name="Zone B-4 Avg Risk (%)" stroke="#d97706" strokeWidth={2} />
            <Line type="monotone" dataKey="fogLevel" name="Fog Density (%)" stroke="#78716c" strokeWidth={2} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
