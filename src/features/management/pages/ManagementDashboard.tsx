import React, { useState } from 'react';
import { useAppStore } from '../../../store/appStore';
import { useAuth } from '../../../hooks/useAuth';
import { StatCard } from '../../../components/StatCard';
import { LeafletFleetMap } from '../../../components/maps/LeafletFleetMap';
import { AlertCard } from '../../../components/AlertCard';
import { SensorHistoryChart } from '../../../components/charts/SensorHistoryChart';
import { RiskTrendChart } from '../../../components/charts/RiskTrendChart';
import { SimulationScenario } from '../../../types';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  CloudFog,
  FileSpreadsheet,
  Globe,
  Radio,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Button } from '../../../components/Button';
import { useNavigate } from 'react-router-dom';

export const ManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    sites,
    vehicles,
    sensors,
    zones,
    alerts,
    activeScenario,
    setScenario,
  } = useAppStore();

  const [alertFilter, setAlertFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  const site = sites[0];
  const isPublicUser = !user || user.role === 'MANAGEMENT';

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const warningAlertsCount = alerts.filter((a) => a.severity === 'WARNING' || a.severity === 'HIGH').length;
  const safetyScore = Math.max(60, 95 - criticalAlertsCount * 12 - warningAlertsCount * 3);

  const filteredAlerts = alerts.filter((a) => {
    if (alertFilter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (alertFilter === 'WARNING') return a.severity === 'WARNING' || a.severity === 'HIGH';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Executive Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700 font-bold shrink-0 shadow-xs">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Mine Operations & Safety Overview
              </h1>
              {isPublicUser && (
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Public Mode
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
              Live IoT Telemetry • Kirandul Iron Ore Mine (NMDC & SECL Region)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<ExternalLink className="w-4 h-4 text-amber-700" />}
            onClick={() => navigate('/map')}
          >
            Full Fleet Map
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={() => alert('📄 Exporting Mine Safety Compliance Report...')}
          >
            Export Safety Audit
          </Button>
        </div>
      </div>

      {/* Scenario Control Quick Buttons */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-stone-900">
            Interactive Operations Simulator:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setScenario('NORMAL_OPERATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'NORMAL_OPERATION'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            Clear Weather (Normal)
          </button>
          <button
            onClick={() => setScenario('FOG_EVENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'FOG_EVENT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            Dense Fog (Visibility &lt; 4m)
          </button>
          <button
            onClick={() => setScenario('COLLISION_RISK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'COLLISION_RISK'
                ? 'bg-red-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            Collision Trajectory
          </button>
          <button
            onClick={() => setScenario('OVERSPEED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScenario === 'OVERSPEED'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            Zone Overspeed
          </button>
        </div>
      </div>

      {/* Strategic Metrics Grid - Resilient grid preventing any overlap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Mine Safety Index"
          value={safetyScore}
          unit="/ 100"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-700" />}
          statusColor="emerald"
          trend={{ value: '+4.2% compliance', isPositive: true }}
          subtext="Target standard: >90"
        />

        <StatCard
          label="Near Miss Interventions"
          value={Math.max(3, warningAlertsCount + criticalAlertsCount)}
          unit="Events"
          icon={<AlertTriangle className="w-5 h-5 text-amber-700" />}
          statusColor="amber"
          trend={{ value: '-20% reduction', isPositive: true }}
          subtext="Proactive Collision Avoidance"
        />

        <StatCard
          label="Active Hazards"
          value={criticalAlertsCount}
          unit="Critical"
          icon={<Flame className="w-5 h-5 text-red-700" />}
          statusColor="red"
          subtext="Zero Fatalities Target"
        />

        <StatCard
          label="Atmospheric Visibility"
          value={site?.currentCondition?.visibilityMeters?.toFixed(1) || '25.0'}
          unit="Meters"
          icon={<CloudFog className="w-5 h-5 text-stone-700" />}
          statusColor="blue"
          subtext={`Status: ${site?.currentCondition?.status || 'CLEAR'}`}
        />
      </div>

      {/* Interactive Mine Map View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-stone-900 text-lg tracking-tight">
              Live Fleet & IoT Telemetry Map
            </h3>
            <p className="text-xs text-stone-600">
              Real-time OpenGIS positioning, haul truck radar coverage & pit zones
            </p>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors cursor-pointer"
          >
            <span>Full Map View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-xs bg-white">
          <LeafletFleetMap vehicles={vehicles} sensors={sensors} zones={zones} height="h-[500px]" />
        </div>
      </div>

      {/* Active Public Safety Alerts Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h3 className="font-extrabold text-stone-900 text-lg tracking-tight">
              Live Mine Safety Alerts Feed
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {filteredAlerts.length} Alerts
            </span>
          </div>

          {/* Quick Alert Filter */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-stone-500 ml-1" />
            <button
              onClick={() => setAlertFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                alertFilter === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAlertFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                alertFilter === 'CRITICAL'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Critical ({criticalAlertsCount})
            </button>
            <button
              onClick={() => setAlertFilter('WARNING')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                alertFilter === 'WARNING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Warnings ({warningAlertsCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.slice(0, 4).map((alert) => (
            <AlertCard key={alert.id} alert={alert} readOnly={isPublicUser} />
          ))}
        </div>
      </div>

      {/* Analytical Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskTrendChart />
        <SensorHistoryChart title="Pit Bench B-4 Atmospheric Visibility" color="#d97706" />
      </div>
    </div>
  );
};
