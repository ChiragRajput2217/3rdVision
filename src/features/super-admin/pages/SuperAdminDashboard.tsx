import React, { useMemo } from 'react';
import { useSiteStore } from '../../../store/siteStore';
import { useAppStore } from '../../../store/appStore';
import { useVehicles } from '../../../hooks/useVehicles';
import { useSensors } from '../../../hooks/useSensors';
import { LeafletFleetMap } from '../../../components/maps/LeafletFleetMap';
import { MOCK_INCIDENTS, MOCK_ZONES } from '../../../services/mockData';
import {
  Truck,
  Radio,
  ShieldAlert,
  MapPin,
  Clock,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  ChevronRight,
  Building2,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { sites, selectedSite, setSelectedSite } = useSiteStore();
  const { alerts, setSelectedSiteId } = useAppStore();
  const { vehicles } = useVehicles(selectedSite.id);
  const { sensors } = useSensors(selectedSite.id);

  const handleSelectSite = (siteId: string) => {
    setSelectedSite(siteId);
    setSelectedSiteId(siteId);
  };

  // Site-specific or fallback counts
  const currentVehiclesCount = selectedSite.totalVehicles || 82;
  const currentSensorsCount = selectedSite.totalSensors || 436;
  const currentAlertsCount = selectedSite.activeAlertsCount || 7;
  const currentZonesCount = 14;

  // Active alerts prioritized
  const displayAlerts = useMemo(() => {
    const siteAlerts = alerts.filter(
      (a) => a.siteId === selectedSite.id || !a.siteId
    );
    return siteAlerts.length > 0 ? siteAlerts : alerts.slice(0, 4);
  }, [alerts, selectedSite]);

  // Zones for current site coordinates
  const currentZones = useMemo(() => {
    const lat = selectedSite.coordinates[0];
    const lng = selectedSite.coordinates[1];
    return MOCK_ZONES.map((z, idx) => ({
      ...z,
      polygonCoordinates: [
        [lat + 0.003 + idx * 0.001, lng - 0.004],
        [lat + 0.005 + idx * 0.001, lng + 0.001],
        [lat + 0.002 + idx * 0.001, lng + 0.003],
        [lat + 0.001 + idx * 0.001, lng - 0.002],
      ] as [number, number][],
    }));
  }, [selectedSite]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      
      {/* ─── 1. HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                STATE GOVERNMENT
              </span>
              <span className="text-xs font-mono text-slate-500">
                Govt of Chhattisgarh & NMDC Regulatory Cell
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              State Mining Operations Dashboard
            </h1>
          </div>
        </div>

        {/* Top bar Site Dropdown */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-mono text-slate-500 uppercase">Target Operations Pit</div>
            <div className="text-xs font-bold text-slate-800">{selectedSite.location}</div>
          </div>
          <div className="relative">
            <select
              value={selectedSite.id}
              onChange={(e) => handleSelectSite(e.target.value)}
              aria-label="Select Target Mining Site"
              className="bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none cursor-pointer pr-8 shadow-sm"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id} className="bg-white text-slate-800">
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── 2. KPI ROW (Four Equal Cards, Subtle Hover, No Glowing Borders) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Vehicles */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Vehicles</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {currentVehiclesCount}
          </div>
          <div className="text-[11px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            100% telemetry online
          </div>
        </div>

        {/* Sensors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Sensors</span>
            <Radio className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {currentSensorsCount}
          </div>
          <div className="text-[11px] font-mono text-blue-600 mt-1">
            Radar, LiDAR & Visibility
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Active Alerts</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            {currentAlertsCount}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Requires monitoring
          </div>
        </div>

        {/* Zones */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Zones</span>
            <MapPin className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {currentZonesCount}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Active geo-fenced sectors
          </div>
        </div>
      </div>

      {/* ─── 3. ACTIVE ALERTS (Directly Below KPIs, Highest Priority) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Active Regional Alerts
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Priority sorted • Real-time telemetry feed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200 ${
                  isCritical ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-amber-500'
                } space-y-3 transition-colors hover:border-slate-300`}
              >
                {/* Severity & Time */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border ${
                      isCritical
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Title & Risk */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {alert.title}
                  </h3>
                  <div className="text-xs text-slate-600 mt-1">
                    {alert.description}
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Vehicle:</span>
                    <span className="text-slate-800 font-bold">
                      {alert.vehicleCode || 'Vehicle D-104'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Zone:</span>
                    <span className="text-amber-700 font-bold">
                      {alert.zoneName || 'Zone B-4'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sensor:</span>
                    <span className="text-slate-700">
                      {alert.sensorId || 'RDR-104 & LiDAR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Risk Score:</span>
                    <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-amber-700'}`}>
                      {alert.severity === 'CRITICAL' ? 91 : 68}%
                    </span>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs font-mono">
                  <span className="text-slate-500 shrink-0">Recommended:</span>
                  <span className="text-amber-800 font-semibold">
                    {alert.recommendedAction || 'Reduce Speed & Maintain 30m Distance'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. LIVE MINE MAP (Largest Section) ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Live Mine Map — {selectedSite.name}
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Haul roads • Vehicle trails • Heading rotation • Click vehicle for telemetry drawer
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            RTK Differential Positioning Active
          </div>
        </div>

        <LeafletFleetMap
          center={selectedSite.coordinates}
          zoom={15}
          vehicles={vehicles}
          sensors={sensors}
          zones={currentZones}
          height="h-[580px]"
        />
      </div>

      {/* ─── 5. SITE COMPARISON (Clean Clickable Table) ─────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Inter-Site Safety & Operational Comparison
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Click any row to switch active telemetry focus
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Site</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Alerts</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4">Vehicles</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sites.map((site) => {
                  const isSelected = site.id === selectedSite.id;
                  return (
                    <tr
                      key={site.id}
                      onClick={() => handleSelectSite(site.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/60 hover:bg-blue-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm font-sans">{site.name}</div>
                        <div className="text-[11px] text-slate-500">{site.location} • {site.code}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                            site.status === 'CRITICAL'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : site.status === 'WARNING'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {site.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-amber-700">
                        {site.activeAlertsCount} active
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-900 font-bold">
                          {site.currentCondition?.visibilityMeters || 4.2}m
                        </span>
                        <span className="text-slate-500 block text-[10px]">
                          Fog: {site.currentCondition?.fogLevelPercent || 65}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700">
                        {site.totalVehicles} tracked
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs">
                          {isSelected ? 'Viewing' : 'Inspect'} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── 6. WEATHER OVERVIEW ────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Atmospheric Weather & Visibility Telemetry — {selectedSite.name}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Optical Visibility</span>
              <Eye className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {selectedSite.currentCondition?.visibilityMeters || 3.2}m
            </div>
            <div className="text-[10px] text-amber-700 font-semibold mt-1">
              Dense Fog Advisory Active
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Relative Humidity</span>
              <Droplets className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {selectedSite.currentCondition?.humidityPercent || 88}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              High condensation level
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Pit Temperature</span>
              <Thermometer className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {selectedSite.currentCondition?.temperatureCelsius || 22}°C
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Ambient temperature
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Surface Wind</span>
              <Wind className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              14 km/h
            </div>
            <div className="text-[10px] text-emerald-700 mt-1">
              Direction: SSW @ 210°
            </div>
          </div>
        </div>
      </div>

      {/* ─── 7. RECENT INCIDENTS ────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">
          Recent Safety Incidents & Interventions Log
        </h2>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 font-mono text-xs">
          {MOCK_INCIDENTS.map((inc) => (
            <div
              key={inc.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      inc.severity === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span className="font-bold text-slate-900 text-sm font-sans">{inc.title}</span>
                </div>
                <div className="text-slate-600 text-[11px]">{inc.description}</div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 shrink-0">
                <div>
                  Zone: <span className="text-amber-700 font-bold">{inc.zoneName}</span>
                </div>
                <div>
                  Status: <span className="text-emerald-700 font-bold">{inc.status}</span>
                </div>
                <div>
                  {new Date(inc.timestamp || '2025-01-01').toLocaleDateString()}{' '}
                  {new Date(inc.timestamp || '2025-01-01').toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
