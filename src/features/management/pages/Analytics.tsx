import React from 'react';
import { StatCard } from '../../../components/StatCard';
import { RiskTrendChart } from '../../../components/charts/RiskTrendChart';
import { SensorHistoryChart } from '../../../components/charts/SensorHistoryChart';
import { BarChart3, TrendingUp, PieChart, ShieldAlert, FileText } from 'lucide-react';
import { Button } from '../../../components/Button';

export const Analytics: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Safety & Fleet Analytics Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Historical Risk Models, Near-Miss Trends & Sensor Degradation Analysis
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<FileText className="w-4 h-4" />}
          onClick={() => alert('📄 Exporting Analytics Dataset...')}
        >
          Export Analytics Data (CSV)
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Operational Hours"
          value="1,420"
          unit="hrs"
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          statusColor="blue"
          subtext="Kirandul Site Alpha"
        />
        <StatCard
          label="Risk Reduction Rate"
          value="34.8"
          unit="%"
          icon={<ShieldAlert className="w-5 h-5 text-emerald-600" />}
          statusColor="emerald"
          trend={{ value: '+8.2% vs last quarter', isPositive: true }}
        />
        <StatCard
          label="Avg Hazard Response"
          value="1.4"
          unit="sec"
          icon={<PieChart className="w-5 h-5 text-amber-600" />}
          statusColor="amber"
          subtext="Target: <2.0s"
        />
        <StatCard
          label="Sensor Accuracy Rate"
          value="99.2"
          unit="%"
          icon={<BarChart3 className="w-5 h-5 text-indigo-600" />}
          statusColor="purple"
          subtext="Radar + LiDAR Fusion"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskTrendChart />
        <SensorHistoryChart title="Historical Visibility Index Trend (m)" color="#2563EB" />
      </div>
    </div>
  );
};
