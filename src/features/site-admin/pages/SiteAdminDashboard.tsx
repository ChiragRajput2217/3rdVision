import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSiteStore } from '../../../store/siteStore';
import { useAlertStore } from '../../../store/alertStore';
import { useVehicles } from '../../../hooks/useVehicles';
import { useSensors } from '../../../hooks/useSensors';
import { useAppStore } from '../../../store/appStore';
import { LeafletFleetMap } from '../../../components/maps/LeafletFleetMap';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from 'recharts';
import {
  HardHat,
  Truck,
  Cpu,
  ShieldAlert,
  MapPin,
  Clock,
  Radio,
  Eye,
  Droplets,
  Thermometer,
  Wind,
  Server,
  Database,
  Wifi,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const SiteAdminDashboard: React.FC = () => {
  const { selectedSiteId } = useAuth();
  const { selectedSite, zones } = useSiteStore();
  const { alerts, acknowledgeAlert } = useAlertStore();
  const { vehicles } = useVehicles(selectedSite.id || selectedSiteId);
  const { sensors } = useSensors(selectedSite.id || selectedSiteId);
  const { connectionStatus } = useAppStore();

  const [selectedVehicleForDrawer, setSelectedVehicleForDrawer] = useState<string | null>(null);

  // Active alerts for this site
  const activeAlerts = alerts.filter(
    (a) =>
      (a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED') &&
      (a.siteId === selectedSite.id || !a.siteId)
  );

  const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicleForDrawer);

  // Trend datasets for the 4 environmental cards
  const visibilityTrend = [
    { time: '06:00', val: 12.0 },
    { time: '07:00', val: 8.5 },
    { time: '08:00', val: 5.2 },
    { time: '09:00', val: 3.2 },
    { time: '10:00', val: 4.1 },
    { time: '11:00', val: 6.8 },
  ];

  const tempTrend = [
    { time: '06:00', val: 19 },
    { time: '07:00', val: 20 },
    { time: '08:00', val: 21 },
    { time: '09:00', val: 22 },
    { time: '10:00', val: 24 },
    { time: '11:00', val: 25 },
  ];

  const humidityTrend = [
    { time: '06:00', val: 94 },
    { time: '07:00', val: 92 },
    { time: '08:00', val: 90 },
    { time: '09:00', val: 88 },
    { time: '10:00', val: 84 },
    { time: '11:00', val: 80 },
  ];

  const windTrend = [
    { time: '06:00', val: 8 },
    { time: '07:00', val: 10 },
    { time: '08:00', val: 12 },
    { time: '09:00', val: 14 },
    { time: '10:00', val: 13 },
    { time: '11:00', val: 11 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans relative z-10">
      
      {/* ─── 1. HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                SITE ADMIN
              </span>
              <span className="text-xs font-mono text-slate-500">
                3rd Vision Operations Center
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {selectedSite.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              {selectedSite.code} • {selectedSite.location} • Status:{' '}
              <span className="text-amber-600 font-bold">{selectedSite.status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <span className="text-slate-500">Excavation Sector: </span>
            <span className="font-bold text-slate-900">Pit Bench B-4</span>
          </div>
        </div>
      </div>

      {/* ─── 2. KPI CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Fleet Vehicles</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {selectedSite.totalVehicles || vehicles.length}
          </div>
          <div className="text-[11px] font-mono text-emerald-700 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            100% active telemetry
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Sensors Active</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {selectedSite.totalSensors || 436}
          </div>
          <div className="text-[11px] font-mono text-blue-600 mt-1">
            GPS, Radar, LiDAR & Vis
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Active Alerts</span>
            <ShieldAlert className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-600 mt-2">
            {activeAlerts.length}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Require operator response
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">Monitored Zones</span>
            <MapPin className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {zones.length || 14}
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Pit benches & haul ramps
          </div>
        </div>
      </div>

      {/* ─── 3. ACTIVE ALERTS ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Active Safety Alerts
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-white/80 px-2 py-1 rounded-md border border-slate-200">
            Live collision avoidance & fog telemetry
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-950">No active alerts</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">All site systems reporting safe parameters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAlerts.slice(0, 3).map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  className={`bg-white/95 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-slate-200 ${
                    isCritical ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-blue-500'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border ${
                        isCritical
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">{alert.title}</h3>
                    <div className="text-xs text-slate-600 mt-1">{alert.description}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Vehicle:</span>
                      <span className="text-slate-800 font-bold">{alert.vehicleCode || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Zone:</span>
                      <span className="text-slate-900 font-bold">{alert.zoneName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Type:</span>
                      <span className="text-slate-800 font-bold">{alert.category || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Status:</span>
                      <span className="text-slate-900 font-bold">{alert.status}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <button
                      onClick={() => acknowledgeAlert(alert.id, 'Site-Admin')}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg font-bold text-[11px] cursor-pointer"
                    >
                      Acknowledge
                    </button>
                    <span className="text-blue-900 font-semibold">{alert.recommendedAction || 'Reduce Speed'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 4. LIVE MAP ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            Live Mine Map — Pit Haul Roads & Tracking
          </h2>
          <span className="text-xs font-mono text-slate-500 bg-white/80 px-2 py-1 rounded-md border border-slate-200">
            Click any vehicle marker to open telemetry drawer
          </span>
        </div>

        <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <LeafletFleetMap
            center={selectedSite.coordinates}
            zoom={15}
            vehicles={vehicles}
            sensors={sensors}
            zones={zones}
            selectedVehicleId={selectedVehicleForDrawer}
            onSelectVehicle={(v) => setSelectedVehicleForDrawer(v.id)}
            height="h-[540px]"
          />
        </div>
      </div>

      {/* ─── 5. SENSOR MONITORING ───────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Sensor Monitoring
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Live telemetry cards for GPS, FMCW Radar, 3D LiDAR & Optical Transmissometers
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Socket.IO Streaming Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* GPS Card */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                GPS-104
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ONLINE
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500">Vehicle: Vehicle D-104</div>
              <div className="text-xs text-slate-500">Direction: South-East (142°)</div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Speed</span>
                <span className="text-slate-900 font-bold text-sm">18 km/h</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Heading</span>
                <span className="text-slate-900 font-bold text-sm">142°</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Health: <strong className="text-emerald-700">98%</strong></span>
              <span>Updated: 2s ago</span>
            </div>
          </div>

          {/* Radar Card */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                RDR-104
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ONLINE
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500">Vehicle: Vehicle D-104</div>
              <div className="text-xs text-slate-500">Direction: Front Facing (0°)</div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Distance</span>
                <span className="text-red-600 font-bold text-sm">14.2 m</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Confidence</span>
                <span className="text-slate-900 font-bold text-sm">96.4%</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Health: <strong className="text-emerald-700">100%</strong></span>
              <span>Updated: 1s ago</span>
            </div>
          </div>

          {/* LiDAR Card */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                LDR-104
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ONLINE
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500">Vehicle: Vehicle D-104</div>
              <div className="text-xs text-slate-500">Direction: 360° Panoramic</div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Nearest Obj</span>
                <span className="text-red-600 font-bold text-sm">14.2 m</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Objects In FOV</span>
                <span className="text-slate-900 font-bold text-sm">3 targets</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Health: <strong className="text-emerald-700">94%</strong></span>
              <span>Updated: 1s ago</span>
            </div>
          </div>

          {/* Visibility Card */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                VIS-04
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                WARNING
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500">Vehicle: Zone B-4 Mast</div>
              <div className="text-xs text-slate-500">Direction: Omnidirectional</div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Visibility</span>
                <span className="text-slate-900 font-bold text-sm">3.2 m</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Humidity</span>
                <span className="text-blue-600 font-bold text-sm">88%</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Health: <strong className="text-emerald-700">92%</strong></span>
              <span>Updated: 5s ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. VEHICLE MONITORING & NETWORK HEALTH (Side-by-side grid) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Monitoring */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Vehicle Monitoring
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Live fleet sensor status
            </span>
          </div>

          <div className="space-y-3 font-mono">
            {vehicles.slice(0, 3).map((v) => (
              <div
                key={v.id}
                className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900">Vehicle {v.code}</span>
                    <span className="text-xs text-slate-500 font-sans">({v.type})</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        v.status === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : v.status === 'WARNING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedVehicleForDrawer(v.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    View Details &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Speed</span>
                    <span className="font-bold text-slate-900">{v.telemetry.speedKmh} km/h</span>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Zone</span>
                    <span className="font-bold text-slate-900 truncate block max-w-full">
                      {v.assignedZoneName || 'Bench B'}
                    </span>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">GPS</span>
                    <span className="font-bold text-emerald-700">ONLINE</span>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Radar</span>
                    <span className="font-bold text-emerald-700">ONLINE</span>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">LiDAR</span>
                    <span className="font-bold text-emerald-700">ONLINE</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Health */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Network Health
            </h2>
          </div>

          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 font-mono text-xs">
            {/* ESP Devices */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-bold text-slate-900">ESP Devices</div>
                  <div className="text-[10px] text-slate-500">436 nodes reporting</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-bold text-emerald-700">ONLINE</span>
              </div>
            </div>

            {/* MQTT */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-bold text-slate-900">MQTT Broker</div>
                  <div className="text-[10px] text-slate-500">EMQX Cluster @ 1883</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-bold text-emerald-700">ONLINE (6ms)</span>
              </div>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-bold text-slate-900">Database</div>
                  <div className="text-[10px] text-slate-500">PostgreSQL / Supabase</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-bold text-emerald-700">ONLINE (4ms)</span>
              </div>
            </div>

            {/* API */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-bold text-slate-900">REST API</div>
                  <div className="text-[10px] text-slate-500">Edge Gateway API v2.4</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-bold text-emerald-700">ONLINE (12ms)</span>
              </div>
            </div>

            {/* Socket.IO */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-bold text-slate-900">Socket.IO</div>
                  <div className="text-[10px] text-slate-500">Real-time telemetry stream</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-bold text-emerald-700">
                  {connectionStatus === 'LIVE' ? 'ONLINE (1ms)' : 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 7. ENVIRONMENTAL CONDITIONS ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Environmental Conditions
          </h2>
          <span className="text-xs font-mono text-slate-500 bg-white/80 px-2 py-1 rounded-md border border-slate-200">
            6-Hour sensor trend records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* Visibility */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase">Visibility</span>
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              {selectedSite.currentCondition.visibilityMeters} <span className="text-sm font-normal text-slate-500">meters</span>
            </div>
            <div className="h-16 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visibilityTrend}>
                  <Line type="monotone" dataKey="val" stroke="#2563EB" strokeWidth={2} dot={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-blue-700 font-semibold">
              {selectedSite.currentCondition.visibilityMeters < 5 ? 'Dense Fog Warning Active' : 'Normal Clear Visibility'}
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase">Temperature</span>
              <Thermometer className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              {selectedSite.currentCondition.temperatureCelsius}° <span className="text-sm font-normal text-slate-500">Celsius</span>
            </div>
            <div className="h-16 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tempTrend}>
                  <Line type="monotone" dataKey="val" stroke="#0284C7" strokeWidth={2} dot={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-500">Normal operating range</div>
          </div>

          {/* Humidity */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase">Humidity</span>
              <Droplets className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              {selectedSite.currentCondition.humidityPercent}% <span className="text-sm font-normal text-slate-500">RH</span>
            </div>
            <div className="h-16 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={humidityTrend}>
                  <Line type="monotone" dataKey="val" stroke="#2563EB" strokeWidth={2} dot={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-500">Moisture levels monitored</div>
          </div>

          {/* Wind Speed */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold uppercase">Wind Speed</span>
              <Wind className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-3xl font-black text-slate-900">
              N/A <span className="text-sm font-normal text-slate-500">km/h</span>
            </div>
            <div className="h-16 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={windTrend}>
                  <Line type="monotone" dataKey="val" stroke="#0D9488" strokeWidth={2} dot={false} />
                  <Tooltip
                    contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-500">Air circulation active</div>
          </div>
        </div>
      </div>

      {/* ─── VEHICLE DETAIL SIDE-DRAWER ──────────────────────────────── */}
      {selectedVehicleObj && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl z-50 p-6 flex flex-col justify-between animate-slideLeft">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-lg">Vehicle {selectedVehicleObj.code}</h3>
              </div>
              <button
                onClick={() => setSelectedVehicleForDrawer(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-sm font-mono">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-bold text-slate-900">{selectedVehicleObj.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${
                      selectedVehicleObj.status === 'CRITICAL'
                        ? 'bg-red-50 text-red-700'
                        : selectedVehicleObj.status === 'WARNING'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {selectedVehicleObj.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Speed:</span>
                  <span className="font-bold text-slate-900">{selectedVehicleObj.telemetry.speedKmh} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bearing:</span>
                  <span className="font-bold text-slate-900">{selectedVehicleObj.telemetry.heading}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fuel Level:</span>
                  <span className="font-bold text-slate-900">{selectedVehicleObj.telemetry.fuelLevelPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Engine Temp:</span>
                  <span className="font-bold text-slate-900">{selectedVehicleObj.telemetry.engineTempCelsius}°C</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-sans font-bold text-slate-900 text-sm">Sensor Diagnostics</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>GPS Signal</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>FMCW Radar</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>3D LiDAR</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>V2X Comms</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedVehicleForDrawer(null)}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close Telemetry Drawer
          </button>
        </div>
      )}
    </div>
  );
};
