import React, { useEffect, useState, useRef } from 'react';
import {
  Cpu,
  Radio,
  WifiOff,
  Activity,
  Zap,
  CircleDot,
  ArrowDown,
  ArrowUp,
  Minus,
  TerminalSquare,
  RefreshCw,
  AlertTriangle,
  Clock,
  Server,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { socketService } from '../../../services/socket.service';
import {
  HardwareStatus,
  RawPacket,
  HardwareRaw,
  HardwareDerived,
  HardwareLatestState,
} from '../../../types';
import { useSiteStore } from '../../../store/siteStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(v: number | null | undefined, decimals = 2, suffix = ''): string {
  if (v === null || v === undefined || isNaN(Number(v))) return 'N/A';
  return `${Number(v).toFixed(decimals)}${suffix}`;
}

function fmtRelTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  const delta = Math.floor((Date.now() - d.getTime()) / 1000);
  if (delta < 0) return 'just now';
  if (delta < 5) return 'just now';
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return d.toLocaleTimeString();
}

function motionBadge(state: string): { label: string; cls: string } {
  if (state === 'HIGH_VIBRATION') return { label: 'HIGH VIBRATION', cls: 'bg-red-50 text-red-700 border-red-200' };
  if (state === 'IN_MOTION') return { label: 'IN MOTION', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'STATIONARY', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

function approachIcon(rate: number | null | undefined) {
  if (rate == null || isNaN(Number(rate))) return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  if (rate > 0.05) return <ArrowDown className="w-3.5 h-3.5 text-red-500" />;
  if (rate < -0.05) return <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}

// ---------------------------------------------------------------------------
// TelemetryField — single named value row
// ---------------------------------------------------------------------------
const TField: React.FC<{
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  inferred?: boolean;
  flash?: boolean;
}> = ({ label, value, sub, highlight, inferred, flash }) => (
  <div
    className={`flex items-center justify-between py-2 px-3 rounded-xl border transition-colors ${
      flash ? 'bg-blue-50 border-blue-200' : 'bg-slate-50/60 border-slate-200'
    } ${highlight ? 'ring-1 ring-blue-300/50' : ''}`}
  >
    <div className="min-w-0">
      <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      {inferred && (
        <span className="ml-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 uppercase">
          inferred
        </span>
      )}
    </div>
    <div className="text-right">
      <span className="text-sm font-bold font-mono text-slate-900">{value}</span>
      {sub && <div className="text-[10px] text-slate-400 font-mono">{sub}</div>}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ConnectionStateBadge
// ---------------------------------------------------------------------------
const ConnectionBadge: React.FC<{ state: string; port: string | null }> = ({ state, port }) => {
  const map: Record<string, { cls: string; dot: string; label: string }> = {
    CONNECTED:      { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500 animate-pulse', label: 'CONNECTED' },
    CONNECTING:     { cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500 animate-pulse',   label: 'CONNECTING' },
    DISCONNECTED:   { cls: 'bg-slate-100 text-slate-500 border-slate-300',     dot: 'bg-slate-400',               label: 'DISCONNECTED' },
    STOPPING:       { cls: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500',               label: 'STOPPING' },
    ERROR:          { cls: 'bg-red-50 text-red-700 border-red-200',            dot: 'bg-red-500',                 label: 'ERROR' },
    NETWORK_INGEST: { cls: 'bg-sky-50 text-sky-700 border-sky-200',           dot: 'bg-sky-500 animate-pulse',   label: 'NETWORK INGEST' },
  };
  const cfg = map[state] || map.DISCONNECTED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
      {state === 'CONNECTED' && port && <span className="opacity-70">• {port}</span>}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main SensorsPage
// ---------------------------------------------------------------------------
export const SensorsPage: React.FC = () => {
  const [status, setStatus] = useState<HardwareStatus | null>(null);
  const [rawPackets, setRawPackets] = useState<RawPacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [flashTelemetry, setFlashTelemetry] = useState(false);
  const [packetFlash, setPacketFlash] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const prevPacketCount = useRef<number>(0);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const packetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch hardware status + raw packets
  useEffect(() => {
    let cancelled = false;

    const loadHardware = async () => {
      try {
        const [statusRes, rawRes] = await Promise.all([
          apiClient.get<HardwareStatus>('/hardware/status'),
          apiClient.get<{ packets: RawPacket[]; Count: number } | RawPacket[]>('/hardware/raw'),
        ]);

        if (cancelled) return;

        const newStatus = statusRes.data;
        setStatus(newStatus);

        // Handle both response shapes
        const packetsData = rawRes.data;
        const packets = Array.isArray(packetsData)
          ? packetsData
          : (packetsData as any).packets || [];
        setRawPackets(packets.slice(0, 10));

        // Flash telemetry when new packets arrive
        if (newStatus.packetCount !== prevPacketCount.current) {
          if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
          setFlashTelemetry(true);
          flashTimeoutRef.current = setTimeout(() => {
            if (!cancelled) setFlashTelemetry(false);
          }, 400);

          if (packets.length > 0) {
            if (packetTimeoutRef.current) clearTimeout(packetTimeoutRef.current);
            setPacketFlash(true);
            packetTimeoutRef.current = setTimeout(() => {
              if (!cancelled) setPacketFlash(false);
            }, 400);
          }
          prevPacketCount.current = newStatus.packetCount;
        }

        setError(null);
        setLastUpdate(new Date());
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Unable to reach backend');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHardware();
    const timer = setInterval(loadHardware, 2000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (packetTimeoutRef.current) clearTimeout(packetTimeoutRef.current);
    };
  }, [refreshKey]);

  // Socket.IO — listen for device:status events
  useEffect(() => {
    const socket = socketService.connect();

    const handleDeviceStatus = (device: any) => {
      if (device.id === 'ESP32_RX_01' || device.deviceType === 'ESP32_RECEIVER' ||
          device.id === 'ESP32_RX_SIM_01' || device.deviceType === 'ESP32_RECEIVER_SIM') {
        setStatus(prev => {
          if (!prev) return prev;
          const isOnline = device.status === 'ONLINE';
          return {
            ...prev,
            connected: isOnline,
            connectionState: isOnline ? 'CONNECTED' : 'DISCONNECTED',
          };
        });
      }
    };

    socket.on('device:status', handleDeviceStatus);

    return () => {
      socket.off('device:status', handleDeviceStatus);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Connecting to hardware gateway…</p>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to reach backend</h2>
        <p className="text-sm text-slate-500 max-w-sm font-mono">{error}</p>
        <p className="text-xs text-slate-400">Ensure the backend is running on port 5000</p>
        <button
          onClick={() => { setLoading(true); setRefreshKey(k => k + 1); }}
          className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const hw = status!;
  const raw = hw.latestState?.raw;
  const derived = hw.latestState?.derived;
  const isConnected = hw.connectionState === 'CONNECTED';
  const motion = derived ? motionBadge(derived.motionState) : motionBadge('STATIONARY');

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">SENSORS</span>
              <span className="text-xs font-mono text-slate-400">Hardware Telemetry Monitor</span>
            </div>
            <div className="flex items-center gap-3 mt-1 mb-0.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                ESP32 Hardware Gateway
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300">
                Data Source: HARDWARE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Real-time telemetry from physical sensor hardware via USB Serial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ConnectionBadge state={hw.connectionState} port={hw.serialPort} />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {lastUpdate ? `Updated ${fmtRelTime(lastUpdate.toISOString())}` : 'Loading…'}
          </div>
        </div>
      </div>

      {/* ── GATEWAY INFO + TELEMETRY GRID ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Gateway Status Card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Hardware Gateway card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-slate-900">Hardware Gateway</h2>
            </div>
            <div className="space-y-2">
              <TField label="Gateway ID"      value={hw.gatewayId}      sub="ESP32 Receiver/Gateway" />
              <TField label="Sensor Node ID"  value={hw.sensorNodeId}   sub="ESP32 Sensor Node" />
              <TField label="Serial Port"     value={hw.serialPort || '—'} sub={isConnected ? `${hw.baudRate} baud` : 'Not connected'} highlight={isConnected} />
              <TField label="Connection"      value={hw.connectionState} sub={`Source: ${hw.source}`} />
              <TField label="Device Type"     value={hw.deviceType} />
              <TField label="Baud Rate"       value={`${hw.baudRate}`} sub="bits/sec" />
              <TField
                label="Packet Count"
                value={hw.packetCount.toLocaleString()}
                sub={hw.lastPacketAt ? `Last: ${fmtRelTime(hw.lastPacketAt)}` : 'No packets'}
                flash={flashTelemetry}
              />
              {hw.lastError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {hw.lastError}
                </div>
              )}
            </div>
          </div>

          {/* Topology diagram */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Data Path</h2>
            <div className="space-y-1.5 font-mono text-xs">
              {[
                { icon: <Radio className="w-3 h-3" />, label: 'ESP32_SENSOR_01', sub: 'MPU6500 · HC-SR04', ok: isConnected },
                { icon: <Zap className="w-3 h-3" />,  label: 'ESP-NOW',          sub: 'wireless link',    ok: isConnected },
                { icon: <CircleDot className="w-3 h-3" />, label: 'ESP32_RX_01', sub: 'Receiver/Gateway', ok: isConnected },
                { icon: <Activity className="w-3 h-3" />, label: 'USB Serial',   sub: hw.serialPort ? `${hw.serialPort} @ ${hw.baudRate}` : 'Not connected', ok: isConnected },
                { icon: <Server className="w-3 h-3" />,   label: 'Backend',      sub: 'hardware.js',      ok: true },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${step.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                    {step.icon}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{step.label}</div>
                    <div className="text-slate-400 text-[10px]">{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry */}
        <div className="lg:col-span-2 space-y-4">

          {/* Live Telemetry header with updating pulse */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-slate-900">Live Telemetry</h2>
                {flashTelemetry && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
                    UPDATING
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                <span className="font-mono">Source: HARDWARE</span>
                <span>·</span>
                <span>{hw.gatewayId}</span>
              </div>
            </div>

            {!isConnected ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <WifiOff className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">Hardware Disconnected</p>
                <p className="text-xs text-slate-400 font-mono">No telemetry received</p>
              </div>
            ) : !raw ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <RefreshCw className="w-6 h-6 text-blue-300 animate-spin" />
                <p className="text-xs font-mono text-slate-400">Waiting for first packet…</p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Distance section — CONFIRMED */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600">HC-SR04 Distance</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono uppercase">confirmed</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TField label="Distance (cm)" value={fmt(raw.distanceCm, 2, ' cm')} flash={flashTelemetry} highlight />
                    <TField label="Distance (m)"  value={fmt(raw.distanceM,  3, ' m')}  flash={flashTelemetry} highlight />
                  </div>
                </div>

                {/* Approach rate & motion — derived */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Derived Motion</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center justify-between py-2 px-3 rounded-xl border ${flashTelemetry ? 'bg-blue-50 border-blue-200' : 'bg-slate-50/60 border-slate-200'}`}>
                      <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wide">Approach Rate</span>
                      <div className="flex items-center gap-1">
                        {approachIcon(derived?.approachRateMps ?? 0)}
                        <span className="text-sm font-bold font-mono text-slate-900">{fmt(derived?.approachRateMps, 3, ' m/s')}</span>
                      </div>
                    </div>
                    <div className={`flex items-center justify-between py-2 px-3 rounded-xl border ${flashTelemetry ? 'bg-blue-50 border-blue-200' : 'bg-slate-50/60 border-slate-200'}`}>
                      <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wide">Motion State</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${motion.cls}`}>{motion.label}</span>
                    </div>
                    <TField label="Distance Change"   value={fmt(derived?.distanceChangeM, 3, ' m')} flash={flashTelemetry} />
                    <TField label="Accel Magnitude"   value={derived?.accelMagnitude !== null && derived?.accelMagnitude !== undefined ? fmt(derived.accelMagnitude, 3, ' g') : 'N/A'} flash={flashTelemetry} />
                  </div>
                </div>

                {/* Accelerometer — INFERRED */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">MPU6500 Accelerometer</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono uppercase">inferred</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <TField label="Accel X" value={fmt(raw.accelX, 3, ' g')} flash={flashTelemetry} inferred />
                    <TField label="Accel Y" value={fmt(raw.accelY, 3, ' g')} flash={flashTelemetry} inferred />
                    <TField
                      label="Accel Z"
                      value={raw.accelZ !== null && raw.accelZ !== undefined ? fmt(raw.accelZ, 3, ' g') : 'N/A'}
                      flash={flashTelemetry}
                      inferred
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <TField
                      label="Pitch"
                      value={derived?.pitch !== null && derived?.pitch !== undefined ? fmt(derived.pitch, 1, '°') : 'N/A'}
                      flash={flashTelemetry}
                    />
                    <TField
                      label="Roll"
                      value={derived?.roll !== null && derived?.roll !== undefined ? fmt(derived.roll, 1, '°') : 'N/A'}
                      flash={flashTelemetry}
                    />
                  </div>
                </div>

                {/* Gyro + Link quality — INFERRED */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Gyro / Link Quality</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono uppercase">inferred</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TField label="Gyro X"      value={raw.gyroX !== null && raw.gyroX !== undefined ? fmt(raw.gyroX, 3) : 'N/A'} flash={flashTelemetry} inferred />
                    <TField label="Gyro Y"      value={raw.gyroY !== null && raw.gyroY !== undefined ? fmt(raw.gyroY, 3) : 'N/A'} flash={flashTelemetry} inferred />
                    <TField label="Gyro Z"      value={raw.gyroZ !== null && raw.gyroZ !== undefined ? fmt(raw.gyroZ, 3) : 'N/A'} flash={flashTelemetry} inferred />
                    <TField label="RSSI (dBm)"  value={raw.rssiDbm !== null && raw.rssiDbm !== undefined ? `${raw.rssiDbm} dBm` : 'N/A'} flash={flashTelemetry} inferred />
                    <TField label="Valid Flag"  value={raw.validFlag !== null && raw.validFlag !== undefined ? `${raw.validFlag}` : 'N/A'} flash={flashTelemetry} inferred />
                    <TField label="Seq. Number" value={raw.sequenceNumber !== null && raw.sequenceNumber !== undefined ? `${raw.sequenceNumber}` : 'N/A'} flash={flashTelemetry} />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Raw Packet Diagnostics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TerminalSquare className="w-4 h-4 text-slate-500" />
                <h2 className="text-sm font-bold text-slate-900">Latest Raw Packets</h2>
                {packetFlash && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">NEW</span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400">Last 10 packets from {hw.sensorNodeId}</span>
            </div>
            {rawPackets.length === 0 ? (
              <p className="text-xs font-mono text-slate-400 py-4 text-center">No packets received yet</p>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {rawPackets.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-1.5 rounded-lg font-mono text-xs ${i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-100'}`}
                  >
                    <span className="text-slate-300 shrink-0 w-4 text-right">{i === 0 ? '▶' : String(i).padStart(2, '0')}</span>
                    <span className={`font-bold shrink-0 ${i === 0 ? 'text-blue-700' : 'text-slate-600'}`}>{p.packet}</span>
                    <span className="text-slate-400 ml-auto shrink-0">{fmtRelTime(p.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DATABASE SENSORS REGISTERED ────────────────────────────── */}
      <DatabaseSensorsPanel />

    </div>
  );
};

// ---------------------------------------------------------------------------
// DatabaseSensorsPanel — shows sensors registered in database (sns-hcsr04-01 etc.)
// ---------------------------------------------------------------------------
const DatabaseSensorsPanel: React.FC = () => {
  const { selectedSite } = useSiteStore();
  const siteId = selectedSite?.id || 'site-kirandul-01';
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    apiClient.get(`/sites/${siteId}/sensors`)
      .then(r => { if (!cancelled) setSensors(r.data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    // Listen for sensor updates
    const socket = socketService.connect();
    const handler = (sensorData: any) => {
      setSensors(prev => prev.map(s => s.id === sensorData.id ? sensorData : s));
    };
    socket.on('sensor:update', handler);
    return () => {
      cancelled = true;
      socket.off('sensor:update', handler);
    };
  }, [siteId]);

  if (loading) return null;
  if (sensors.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-900">Registered Sensors</h2>
        <span className="text-xs font-mono text-slate-400 ml-auto">{sensors.length} sensor{sensors.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase bg-slate-50/70">
              <th className="py-2.5 px-3 rounded-tl-lg">ID</th>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Vehicle</th>
              <th className="py-2.5 px-3">Distance (m)</th>
              <th className="py-2.5 px-3 rounded-tr-lg">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((s, i) => {
              const distM = s.telemetry?.distanceMeters ?? s.telemetry?.radar?.distanceMeters;
              const statusMap: Record<string, string> = {
                ONLINE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                DEGRADED: 'bg-amber-50 text-amber-700 border-amber-200',
                OFFLINE: 'bg-slate-100 text-slate-500 border-slate-200',
                FAULT: 'bg-red-50 text-red-700 border-red-200',
              };
              return (
                <tr key={s.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="py-2.5 px-3 font-mono text-xs font-bold text-slate-700">{s.id}</td>
                  <td className="py-2.5 px-3 text-sm text-slate-800">{s.name}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{s.type}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusMap[s.status] || statusMap.OFFLINE}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs font-mono text-slate-500">{s.vehicleCode || '—'}</td>
                  <td className="py-2.5 px-3 font-mono text-xs font-bold text-slate-800">
                    {distM !== null && distM !== undefined && !isNaN(Number(distM)) ? `${Number(distM).toFixed(3)} m` : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 text-xs font-mono text-slate-400">{fmtRelTime(s.lastUpdate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
