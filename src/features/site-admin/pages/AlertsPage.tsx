import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Filter,
  CheckCheck,
  Bell,
  BellOff,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { socketService } from '../../../services/socket.service';
import { useSiteStore } from '../../../store/siteStore';
import { Alert, AlertSeverity, AlertStatus } from '../../../types';

function fmtTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtRelTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  const delta = Math.floor((Date.now() - d.getTime()) / 1000);
  if (delta < 0) return 'just now';
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return `${Math.floor(delta / 3600)}h ago`;
}

const severityConfig: Record<string, { badge: string; row: string }> = {
  INFO:     { badge: 'bg-blue-50 text-blue-700 border-blue-200',    row: '' },
  WARNING:  { badge: 'bg-amber-50 text-amber-800 border-amber-200', row: 'bg-amber-50/20' },
  HIGH:     { badge: 'bg-red-50 text-red-700 border-red-200',       row: 'bg-red-50/20' },
  CRITICAL: { badge: 'bg-red-100 text-red-800 border-red-300 font-black animate-pulse', row: 'bg-red-50/30' },
};

const statusConfig: Record<string, { badge: string }> = {
  ACTIVE:       { badge: 'bg-red-50 text-red-700 border-red-200' },
  ACKNOWLEDGED: { badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  RESOLVED:     { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ESCALATED:    { badge: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const AlertsPage: React.FC = () => {
  const { selectedSite } = useSiteStore();
  const siteId = selectedSite?.id || 'site-kirandul-01';

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ACTIVE');
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAlerts = async () => {
      try {
        const res = await apiClient.get<Alert[]>(`/sites/${siteId}/alerts`);
        if (cancelled) return;
        setAlerts(res.data || []);
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

    loadAlerts();

    return () => {
      cancelled = true;
    };
  }, [siteId, refreshKey]);

  // Socket.IO live alert events (verified real backend events)
  useEffect(() => {
    const socket = socketService.connect();

    const handleNew = (alert: Alert) => {
      setAlerts(prev => [alert, ...prev.filter(a => a.id !== alert.id)]);
      setLastUpdate(new Date());
    };
    const handleUpdate = (alert: Alert) => {
      setAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
      setLastUpdate(new Date());
    };

    socket.on('alert:created', handleNew);
    socket.on('alert:updated', handleUpdate);

    return () => {
      socket.off('alert:created', handleNew);
      socket.off('alert:updated', handleUpdate);
    };
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledging(alertId);
    try {
      const res = await apiClient.post<Alert>(`/alerts/${alertId}/acknowledge`, { acknowledgedBy: 'Operator' });
      setAlerts(prev => prev.map(a => a.id === alertId ? res.data : a));
    } catch {
      // Optimistic UI update fallback
      setAlerts(prev => prev.map(a => a.id === alertId ? {
        ...a, status: 'ACKNOWLEDGED' as AlertStatus,
        acknowledgedBy: 'Operator', acknowledgedAt: new Date().toISOString(),
      } : a));
    } finally {
      setAcknowledging(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    setResolving(alertId);
    try {
      const res = await apiClient.post<Alert>(`/alerts/${alertId}/resolve`, {});
      setAlerts(prev => prev.map(a => a.id === alertId ? res.data : a));
    } catch {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' as AlertStatus } : a));
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Loading alerts…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <h2 className="text-xl font-bold text-slate-900">Unable to reach backend</h2>
        <p className="text-sm text-slate-500 font-mono">{error}</p>
        <button onClick={() => { setLoading(true); setRefreshKey(k => k + 1); }} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  // Apply filters
  const filtered = alerts.filter(a => {
    const sevOk = severityFilter === 'ALL' || a.severity === severityFilter;
    const stOk = statusFilter === 'ALL' || a.status === statusFilter;
    return sevOk && stOk;
  });

  // Stats
  const active = alerts.filter(a => a.status === 'ACTIVE').length;
  const acknowledged = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const critical = alerts.filter(a => a.severity === 'CRITICAL').length;
  const resolved = alerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${active > 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            {active > 0 ? <ShieldAlert className="w-6 h-6 text-red-500" /> : <Bell className="w-6 h-6 text-blue-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">ALERTS</span>
              {active > 0 && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 animate-pulse">
                  {active} ACTIVE
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">Safety Alert Centre</h1>
            <p className="text-xs text-slate-400 font-mono">{alerts.length} total alerts · Real-time via Socket.IO</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          {lastUpdate ? `Updated ${fmtRelTime(lastUpdate.toISOString())}` : '—'}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Alerts',  value: alerts.length,    cls: 'text-slate-900' },
          { label: 'Active',        value: active,           cls: active > 0 ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Acknowledged',  value: acknowledged,     cls: acknowledged > 0 ? 'text-amber-600' : 'text-slate-700' },
          { label: 'Critical',      value: critical,         cls: critical > 0 ? 'text-red-700 font-black' : 'text-slate-700' },
          { label: 'Resolved',      value: resolved,         cls: 'text-emerald-700' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">{kpi.label}</div>
            <div className={`text-3xl font-black mt-1 ${kpi.cls}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-mono text-slate-400">Status:</span>
          {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Severity:</span>
          {(['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-colors ${severityFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white border border-slate-200 rounded-2xl">
          <BellOff className="w-10 h-10 text-slate-200" />
          <p className="text-slate-500 font-semibold">No active alerts</p>
          <p className="text-xs text-slate-400 font-mono">
            {alerts.length === 0 ? 'No alert records exist yet' : `${alerts.length - filtered.length} alerts hidden by current filter`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase bg-slate-50/70">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(alert => {
                const sc = severityConfig[alert.severity] || severityConfig.INFO;
                const stc = statusConfig[alert.status] || statusConfig.ACTIVE;
                return (
                  <tr key={alert.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${sc.row}`}>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${sc.badge}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 text-sm">{alert.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{alert.description}</div>
                      {alert.currentValue && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{alert.currentValue}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {alert.category?.replace('_', ' ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {alert.vehicleCode || alert.vehicleId || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${alert.riskScorePercent >= 70 ? 'bg-red-500' : alert.riskScorePercent >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(alert.riskScorePercent || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700">{alert.riskScorePercent ?? '—'}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${stc.badge}`}>
                        {alert.status}
                      </span>
                      {alert.acknowledgedBy && (
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">by {alert.acknowledgedBy}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-400">
                      {fmtTime(alert.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {alert.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            disabled={acknowledging === alert.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold hover:bg-amber-100 disabled:opacity-50 transition-colors"
                          >
                            {acknowledging === alert.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                            ACK
                          </button>
                        )}
                        {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            disabled={resolving === alert.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                          >
                            {resolving === alert.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            RESOLVE
                          </button>
                        )}
                        {alert.status === 'RESOLVED' && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
