import React, { useEffect, useState } from 'react';
import {
  Settings,
  Radio,
  Server,
  User,
  MapPin,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Activity,
  WifiOff,
  Cpu,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useSiteStore } from '../../../store/siteStore';
import { useAuth } from '../../../hooks/useAuth';

interface HardwareStatus {
  connected: boolean;
  connectionState: string;
  serialPort: string | null;
  baudRate: number;
  packetCount: number;
  lastPacketAt: string | null;
  gatewayId: string;
  sensorNodeId: string;
  source: string;
  lastError: string | null;
}

interface HealthData {
  status: string;
  version: string;
  mode: string;
  services: {
    database: string;
    hardware: string;
    weather: string;
    ml: string;
    simulator: string;
  };
}

function fmtRelTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  const delta = Math.floor((Date.now() - d.getTime()) / 1000);
  if (delta < 0) return 'just now';
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return d.toLocaleTimeString();
}

const SettingRow: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({ label, value, sub }) => (
  <div className="flex items-center justify-between py-3 px-0 border-b border-slate-100 last:border-0">
    <div>
      <div className="text-sm font-semibold text-slate-700">{label}</div>
      {sub && <div className="text-xs font-mono text-slate-400 mt-0.5">{sub}</div>}
    </div>
    <div className="text-right">{typeof value === 'string' ? <span className="text-sm font-mono font-bold text-slate-800">{value}</span> : value}</div>
  </div>
);

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; cls?: string }> = ({ icon, title, children, cls }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ${cls || ''}`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="text-blue-500">{icon}</div>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
    </div>
    {children}
  </div>
);

export const SettingsPage: React.FC = () => {
  const [hw, setHw] = useState<HardwareStatus | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedSite } = useSiteStore();
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const [hwRes, healthRes] = await Promise.allSettled([
          apiClient.get<HardwareStatus>('/hardware/status'),
          apiClient.get<HealthData>('/health'),
        ]);

        if (cancelled) return;

        if (hwRes.status === 'fulfilled') setHw(hwRes.value.data);
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      } catch {
        // silently continue — individual sections will show N/A
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConfig();
    const timer = setInterval(loadConfig, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12 font-sans">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
          <Settings className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">SETTINGS</span>
            <span className="text-xs font-mono text-slate-400">System Configuration</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">3rd Vision Settings</h1>
          <p className="text-xs text-slate-400 font-mono">Read-only view of active system configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Site */}
        <SectionCard icon={<MapPin className="w-4 h-4" />} title="Mining Site">
          <SettingRow label="Site Name"     value={selectedSite?.name || 'N/A'} />
          <SettingRow label="Site Code"     value={selectedSite?.code || 'N/A'} />
          <SettingRow label="Location"      value={selectedSite?.location || 'N/A'} />
          <SettingRow label="State"         value={selectedSite?.state || 'N/A'} />
          <SettingRow
            label="Operational Status"
            value={
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                selectedSite?.status === 'CRITICAL'    ? 'bg-red-50 text-red-700 border-red-200' :
                selectedSite?.status === 'OPERATIONAL' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                         'bg-amber-50 text-amber-700 border-amber-200'
              }`}>{selectedSite?.status || 'N/A'}</span>
            }
          />
        </SectionCard>

        {/* Operator Profile */}
        <SectionCard icon={<User className="w-4 h-4" />} title="Operator Profile">
          <SettingRow label="Name"          value={user?.displayName || 'Demo User'} />
          <SettingRow label="Email"         value={user?.email || 'N/A'} />
          <SettingRow label="Role"          value={user?.role || 'SITE_ADMIN'} />
          <SettingRow label="Organisation"  value={user?.organizationName || 'NMDC Limited'} />
          <SettingRow
            label="Assigned Sites"
            value={
              <span className="text-sm font-mono text-slate-700">
                {user?.assignedSiteIds?.length ?? 1} site(s)
              </span>
            }
          />
        </SectionCard>

        {/* Hardware Configuration */}
        <SectionCard
          icon={<Radio className="w-4 h-4" />}
          title="Hardware Configuration"
          cls={hw?.connected ? 'border-emerald-200' : ''}
        >
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-slate-400 text-sm font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <SettingRow
                label="Connection Status"
                value={
                  <div className="flex items-center gap-1.5">
                    {hw?.connected
                      ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-mono font-bold text-emerald-700">CONNECTED</span></>
                      : <><WifiOff className="w-3.5 h-3.5 text-slate-400" /><span className="text-[10px] font-mono font-bold text-slate-500">DISCONNECTED</span></>
                    }
                  </div>
                }
              />
              <SettingRow label="Serial Port"      value={hw?.serialPort    || 'Not connected'} sub="USB Serial interface" />
              <SettingRow label="Baud Rate"        value={hw?.baudRate ? `${hw.baudRate} bps` : 'N/A'} />
              <SettingRow label="Gateway ID"       value={hw?.gatewayId     || 'N/A'} sub="ESP32 Receiver (USB-connected)" />
              <SettingRow label="Sensor Node ID"   value={hw?.sensorNodeId  || 'N/A'} sub="ESP32 Sensor (wireless ESP-NOW)" />
              <SettingRow label="Packets Received" value={hw?.packetCount?.toLocaleString() ?? '0'} sub={hw?.lastPacketAt ? `Last: ${fmtRelTime(hw.lastPacketAt)}` : 'No packets yet'} />
              {hw?.lastError && (
                <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{hw.lastError}</span>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* System Health */}
        <SectionCard icon={<Server className="w-4 h-4" />} title="System Health">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-slate-400 text-sm font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : health ? (
            <>
              <SettingRow label="Backend Version"   value={`v${health.version}`} />
              <SettingRow label="Operation Mode"    value={health.mode} />
              <SettingRow
                label="Overall Status"
                value={
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    health.status === 'HEALTHY'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    health.status === 'DEGRADED'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                    'bg-red-50 text-red-700 border-red-200'
                  }`}>{health.status}</span>
                }
              />
              <div className="mt-3 space-y-2">
                {Object.entries(health.services).map(([name, status]) => {
                  const ok = ['ONLINE', 'LIVE', 'CONNECTED', 'ENABLED', 'RUNNING', 'ACTIVE'].includes(status);
                  const warn = ['FALLBACK_READY', 'STALE', 'DEGRADED', 'PAUSED'].includes(status);
                  return (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500 capitalize">{name.replace('_', ' ')}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        ok   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        warn ? 'bg-amber-50 text-amber-700 border-amber-200' :
                               'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 font-mono py-4">No data available</p>
          )}
        </SectionCard>

        {/* Risk Configuration — read-only */}
        <SectionCard icon={<Activity className="w-4 h-4" />} title="Risk Configuration">
          <p className="text-xs font-mono text-slate-400 mb-3">Configured safety thresholds (read-only)</p>
          {[
            { label: 'Proximity Warning',    value: '< 4.0 m',   sub: 'HC-SR04 detection range' },
            { label: 'Critical Distance',    value: '< 1.5 m',   sub: 'Immediate stop zone' },
            { label: 'ML Timeout',           value: '800 ms',    sub: 'Inference fallback threshold' },
            { label: 'Reconnect Interval',   value: '5 000 ms',  sub: 'Serial auto-reconnect delay' },
            { label: 'Weather Polling',      value: '10 min',    sub: 'Open-Meteo update interval' },
          ].map(r => (
            <SettingRow key={r.label} label={r.label} value={r.value} sub={r.sub} />
          ))}
        </SectionCard>

        {/* Unavailable settings */}
        <SectionCard icon={<Cpu className="w-4 h-4" />} title="Hardware Capabilities">
          <p className="text-xs font-mono text-slate-400 mb-3">Current hardware provision status</p>
          {[
            { label: 'HC-SR04 Ultrasonic Distance',  available: true,  note: 'Active — COM5' },
            { label: 'MPU6500 Accelerometer (X/Y)',  available: true,  note: 'Partial — Z-axis not transmitted' },
            { label: 'ESP-NOW RSSI',                 available: true,  note: 'Inferred from DATA packet F7' },
            { label: 'GPS / Location',               available: false, note: 'Not available on hardware' },
            { label: 'Vehicle Speed',                available: false, note: 'Not available on hardware' },
            { label: 'Fuel Level',                   available: false, note: 'Not available on hardware' },
            { label: 'Engine Temperature',           available: false, note: 'Not available on hardware' },
            { label: 'Pitch / Roll (full)',          available: false, note: 'Requires accelZ — not transmitted' },
          ].map(cap => (
            <div key={cap.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <span className="text-sm text-slate-700">{cap.label}</span>
                <div className="text-[10px] font-mono text-slate-400">{cap.note}</div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                cap.available
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                {cap.available ? 'AVAILABLE' : 'N/A'}
              </span>
            </div>
          ))}
        </SectionCard>

      </div>
    </div>
  );
};
