import React, { useEffect, useState } from 'react';
import {
  Truck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Activity,
  User,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { socketService } from '../../../services/socket.service';
import { useSiteStore } from '../../../store/siteStore';
import { Vehicle } from '../../../types';

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

const statusConfig: Record<string, { badge: string; label: string }> = {
  SAFE:      { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'SAFE' },
  WARNING:   { badge: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'WARNING' },
  HIGH_RISK: { badge: 'bg-red-50 text-red-700 border-red-200',             label: 'HIGH RISK' },
  CRITICAL:  { badge: 'bg-red-100 text-red-800 border-red-300 font-black', label: 'CRITICAL' },
};

const typeIcon: Record<string, string> = {
  DUMPER:     '🚛',
  EXCAVATOR:  '🏗',
  HAUL_TRUCK: '🚚',
  DRILL_RIG:  '⛏',
  PATROL:     '🚐',
};

export const VehiclesPage: React.FC = () => {
  const { selectedSite } = useSiteStore();
  const siteId = selectedSite?.id || 'site-kirandul-01';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const res = await apiClient.get<Vehicle[]>(`/sites/${siteId}/vehicles`);
        if (cancelled) return;
        setVehicles(res.data || []);
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

    loadData();

    return () => {
      cancelled = true;
    };
  }, [siteId, refreshKey]);

  // Socket.IO: live vehicle updates
  useEffect(() => {
    const socket = socketService.connect();
    const handleVehicleUpdate = (updatedVehicle: Vehicle) => {
      setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
      setLastUpdate(new Date());
      setSelectedVehicle(prev => prev?.id === updatedVehicle.id ? updatedVehicle : prev);
    };
    socket.on('vehicle:update', handleVehicleUpdate);
    return () => { socket.off('vehicle:update', handleVehicleUpdate); };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Loading vehicle fleet…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <h2 className="text-xl font-bold text-slate-900">Unable to reach backend</h2>
        <p className="text-sm text-slate-500 font-mono">{error}</p>
        <button onClick={() => setRefreshKey(k => k + 1)} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <Truck className="w-10 h-10 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-500">No vehicle data available</h2>
        <p className="text-sm text-slate-400 font-mono">No vehicles registered for this site</p>
      </div>
    );
  }

  const statuses = ['ALL', 'SAFE', 'WARNING', 'HIGH_RISK', 'CRITICAL'];
  const filtered = filter === 'ALL' ? vehicles : vehicles.filter(v => v.status === filter);

  // Stats
  const byStatus = vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">VEHICLES</span>
              <span className="text-xs font-mono text-slate-400">Fleet Management</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">Active Fleet</h1>
            <p className="text-xs text-slate-400 font-mono">{vehicles.length} vehicles · {selectedSite?.name || 'Kirandul Iron Ore Complex'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {lastUpdate ? `Updated ${fmtRelTime(lastUpdate.toISOString())}` : '—'}
          <Activity className="w-3.5 h-3.5 ml-2 text-blue-400 animate-pulse" />
          <span className="text-blue-500">LIVE</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Vehicles', value: vehicles.length, cls: 'text-slate-900' },
          { label: 'Safe',      value: byStatus.SAFE      || 0, cls: 'text-emerald-700' },
          { label: 'Warning',   value: byStatus.WARNING   || 0, cls: 'text-amber-700' },
          { label: 'High Risk / Critical', value: (byStatus.HIGH_RISK || 0) + (byStatus.CRITICAL || 0), cls: 'text-red-700' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">{kpi.label}</div>
            <div className={`text-3xl font-black mt-1 ${kpi.cls}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
              filter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {s === 'ALL' ? `All (${vehicles.length})` : `${s.replace('_', ' ')} (${byStatus[s] || 0})`}
          </button>
        ))}
      </div>

      {/* Vehicles table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase bg-slate-50/70">
              <th className="py-3 px-4">Vehicle</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Operator</th>
              <th className="py-3 px-4">Status / Risk</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Distance (nearest)</th>
              <th className="py-3 px-4">Sensors</th>
              <th className="py-3 px-4">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => {
              const sc = statusConfig[v.status] || statusConfig.SAFE;
              const telem = v.telemetry;
              const distM = telem?.nearestVehicleDistanceMeters;
              return (
                <tr
                  key={v.id}
                  className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-slate-50/20'} ${selectedVehicle?.id === v.id ? 'bg-blue-50/40' : ''}`}
                  onClick={() => setSelectedVehicle(selectedVehicle?.id === v.id ? null : v)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeIcon[v.type] || '🚗'}</span>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{v.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{v.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-500">{v.type}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-sm text-slate-700">{v.driverName || v.operatorName || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}>{sc.label}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${telem?.riskScorePercent >= 70 ? 'bg-red-500' : telem?.riskScorePercent >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(telem?.riskScorePercent || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700">{telem?.riskScorePercent ?? 'N/A'}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700">
                    {distM !== null && distM !== undefined ? `${Number(distM).toFixed(2)} m` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-500">
                    {v.sensorsAttached?.length ?? 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-400">
                    {fmtRelTime(telem?.lastUpdate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded vehicle detail panel */}
      {selectedVehicle && (
        <VehicleDetail vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// VehicleDetail — expanded telemetry for one selected vehicle
// ---------------------------------------------------------------------------
const VehicleDetail: React.FC<{ vehicle: Vehicle; onClose: () => void }> = ({ vehicle, onClose }) => {
  const t = vehicle.telemetry;
  return (
    <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeIcon[vehicle.type] || '🚗'}</span>
          <div>
            <h3 className="font-black text-slate-900">{vehicle.name}</h3>
            <p className="text-xs font-mono text-slate-400">{vehicle.code} · {vehicle.type}</p>
          </div>
        </div>
        <button onClick={onClose} className="px-3 py-1 rounded-xl bg-slate-100 text-xs font-mono text-slate-500 hover:bg-slate-200 transition-colors">Close</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Zone',            value: vehicle.assignedZoneName || 'N/A' },
          { label: 'Operator',        value: vehicle.driverName || vehicle.operatorName || 'N/A' },
          { label: 'Risk Score',      value: `${t?.riskScorePercent ?? 'N/A'}%` },
          { label: 'Recommended Speed', value: t?.recommendedSpeedKmh ? `${t.recommendedSpeedKmh} km/h` : 'N/A' },
          { label: 'Nearest Distance', value: t?.nearestVehicleDistanceMeters != null ? `${Number(t.nearestVehicleDistanceMeters).toFixed(2)} m` : 'N/A' },
          { label: 'Recommended Action', value: t?.recommendedAction || 'N/A' },
          { label: 'Speed (recorded)', value: 'N/A', note: 'GPS not available on hardware' },
          { label: 'Heading',         value: 'N/A', note: 'GPS not available on hardware' },
        ].map(item => (
          <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide">{item.label}</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{item.value}</div>
            {item.note && <div className="text-[9px] font-mono text-slate-400 mt-0.5">{item.note}</div>}
          </div>
        ))}
      </div>
      {t?.riskFactors && t.riskFactors.length > 0 && (
        <div className="mt-3 flex items-start gap-2 flex-wrap">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase mt-1">Risk Factors:</span>
          {t.riskFactors.map((f, i) => (
            <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
};
