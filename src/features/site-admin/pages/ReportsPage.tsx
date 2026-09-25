import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  RefreshCw,
  AlertTriangle,
  Truck,
  ShieldAlert,
  Radio,
  Clock,
  CheckCircle2,
  Download,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiClient } from '../../../services/api';
import { useSiteStore } from '../../../store/siteStore';
import { Alert, Vehicle, HardwareStatus } from '../../../types';

interface HealthData {
  status: string;
  version: string;
  mode: string;
  timestamp: string;
  services: {
    database: string;
    hardware: string;
    weather: string;
    ml: string;
    realtime?: string;
  };
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return 'N/A';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const StatBox: React.FC<{ label: string; value: string | number; sub?: string; cls?: string }> = ({
  label,
  value,
  sub,
  cls,
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">{label}</div>
    <div className={`text-2xl font-black mt-1 ${cls || 'text-slate-900'}`}>{value}</div>
    {sub && <div className="text-[10px] font-mono text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

const ServiceRow: React.FC<{ name: string; status: string }> = ({ name, status }) => {
  const ok = ['ONLINE', 'LIVE', 'CONNECTED', 'ENABLED', 'RUNNING', 'ACTIVE'].includes(status);
  const warn = ['FALLBACK_READY', 'STALE', 'DEGRADED', 'PAUSED'].includes(status);
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50/60 border border-slate-200">
      <span className="text-xs font-mono text-slate-600">{name}</span>
      <span
        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
          ok
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : warn
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}
      >
        {status}
      </span>
    </div>
  );
};

export const ReportsPage: React.FC = () => {
  const { selectedSite } = useSiteStore();
  const siteId = selectedSite?.id || 'site-kirandul-01';

  const [health, setHealth] = useState<HealthData | null>(null);
  const [hw, setHw] = useState<HardwareStatus | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters (affect BOTH the display and exports)
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | '1H' | '24H' | '7D'>('ALL');

  useEffect(() => {
    let cancelled = false;

    const loadReports = async () => {
      try {
        const [healthRes, hwRes, vehiclesRes, alertsRes] = await Promise.allSettled([
          apiClient.get<HealthData>('/health'),
          apiClient.get<HardwareStatus>('/hardware/status'),
          apiClient.get<Vehicle[]>(`/sites/${siteId}/vehicles`),
          apiClient.get<Alert[]>(`/sites/${siteId}/alerts`),
        ]);

        if (cancelled) return;

        if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
        if (hwRes.status === 'fulfilled') setHw(hwRes.value.data);
        if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value.data || []);
        if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data || []);

        setError(null);
        setRefreshedAt(new Date());
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Unable to reach backend');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [siteId, refreshKey]);

  // Derived filtered alerts (uses report snapshot time to keep render pure and idempotent)
  const filteredAlerts = useMemo(() => {
    const referenceTime = refreshedAt ? refreshedAt.getTime() : null;
    return alerts.filter((a) => {
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) {
        return false;
      }
      if (dateRangeFilter !== 'ALL' && referenceTime !== null) {
        const alertTime = new Date(a.timestamp).getTime();
        if (isNaN(alertTime)) return false;
        const diffMs = referenceTime - alertTime;
        if (dateRangeFilter === '1H' && diffMs > 3600 * 1000) return false;
        if (dateRangeFilter === '24H' && diffMs > 24 * 3600 * 1000) return false;
        if (dateRangeFilter === '7D' && diffMs > 7 * 24 * 3600 * 1000) return false;
      }
      return true;
    });
  }, [alerts, severityFilter, dateRangeFilter, refreshedAt]);

  // Summary Metrics directly derived from backend data
  const totalVehicles = vehicles.length;
  const byVehicleStatus = useMemo(() => {
    return vehicles.reduce<Record<string, number>>((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});
  }, [vehicles]);

  const activeAlertsCount = filteredAlerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalAlertsCount = filteredAlerts.filter((a) => a.severity === 'CRITICAL').length;
  const highAlertsCount = filteredAlerts.filter((a) => a.severity === 'HIGH').length;
  const warningAlertsCount = filteredAlerts.filter((a) => a.severity === 'WARNING').length;
  const resolvedAlertsCount = filteredAlerts.filter((a) => a.status === 'RESOLVED').length;

  const raw = hw?.latestState?.raw;
  const derived = hw?.latestState?.derived;

  // ── CSV Export Handler ──────────────────────────────────────────────────
  const handleExportCSV = () => {
    try {
      setExportError(null);
      const today = new Date().toISOString().split('T')[0];
      const filename = `3rd-Vision-Report-${today}.csv`;

      const lines: string[] = [];

      // 1. Report Metadata
      lines.push('=== 3RD VISION SAFETY OPERATIONS REPORT ===');
      lines.push(`Site,${escapeCsvCell(selectedSite?.name || 'Kirandul Iron Ore Complex')}`);
      lines.push(`Site ID,${escapeCsvCell(siteId)}`);
      lines.push(`Generated At,${escapeCsvCell(new Date().toISOString())}`);
      lines.push(`Backend Version,${escapeCsvCell(health?.version ? `v${health.version}` : 'N/A')}`);
      lines.push(`Operating Mode,${escapeCsvCell(health?.mode || 'N/A')}`);
      lines.push(`Severity Filter,${escapeCsvCell(severityFilter)}`);
      lines.push(`Date Range Filter,${escapeCsvCell(dateRangeFilter)}`);
      lines.push('');

      // 2. Summary KPI Metrics
      lines.push('=== SUMMARY METRICS ===');
      lines.push('Metric,Value');
      lines.push(`Total Vehicles,${totalVehicles}`);
      lines.push(`Vehicles (Safe),${byVehicleStatus.SAFE || 0}`);
      lines.push(`Vehicles (Warning),${byVehicleStatus.WARNING || 0}`);
      lines.push(`Vehicles (High Risk),${byVehicleStatus.HIGH_RISK || 0}`);
      lines.push(`Vehicles (Critical),${byVehicleStatus.CRITICAL || 0}`);
      lines.push(`Total Filtered Alerts,${filteredAlerts.length}`);
      lines.push(`Active Alerts,${activeAlertsCount}`);
      lines.push(`Critical Alerts,${criticalAlertsCount}`);
      lines.push(`High Alerts,${highAlertsCount}`);
      lines.push(`Warning Alerts,${warningAlertsCount}`);
      lines.push(`Resolved Alerts,${resolvedAlertsCount}`);
      lines.push(`Hardware Packets Received,${hw?.packetCount ?? 'N/A'}`);
      lines.push(`Hardware Connection,${hw?.connectionState ?? 'N/A'}`);
      lines.push(`Hardware Distance (cm),${raw?.distanceCm != null ? raw.distanceCm : 'N/A'}`);
      lines.push(`Hardware Distance (m),${raw?.distanceM != null ? raw.distanceM : 'N/A'}`);
      lines.push(`Approach Rate (m/s),${derived?.approachRateMps != null ? derived.approachRateMps : 'N/A'}`);
      lines.push(`Motion State,${derived?.motionState || 'N/A'}`);
      lines.push('');

      // 3. Vehicles Table
      lines.push('=== FLEET INVENTORY & RISK STATUS ===');
      lines.push('Vehicle ID,Code,Name,Type,Status,Risk Score (%),Speed (km/h),Recommended Speed (km/h),Nearest Distance (m),Assigned Zone,Operator');
      if (vehicles.length === 0) {
        lines.push('N/A,N/A,No vehicle data available,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A');
      } else {
        vehicles.forEach((v) => {
          lines.push(
            [
              escapeCsvCell(v.id),
              escapeCsvCell(v.code),
              escapeCsvCell(v.name),
              escapeCsvCell(v.type),
              escapeCsvCell(v.status),
              escapeCsvCell(v.telemetry?.riskScorePercent ?? 'N/A'),
              escapeCsvCell(v.telemetry?.speedKmh ?? 'N/A'),
              escapeCsvCell(v.telemetry?.recommendedSpeedKmh ?? 'N/A'),
              escapeCsvCell(v.telemetry?.nearestVehicleDistanceMeters ?? 'N/A'),
              escapeCsvCell(v.assignedZoneName || v.zoneId || 'N/A'),
              escapeCsvCell(v.driverName || v.operatorName || 'N/A'),
            ].join(',')
          );
        });
      }
      lines.push('');

      // 4. Alerts Table
      lines.push('=== ALERTS LOG (FILTERED) ===');
      lines.push('Alert ID,Severity,Status,Category,Vehicle Code,Risk Score (%),Title,Current Value,Timestamp,Acknowledged By');
      if (filteredAlerts.length === 0) {
        lines.push('N/A,N/A,No alerts match current filter,N/A,N/A,N/A,N/A,N/A,N/A,N/A');
      } else {
        filteredAlerts.forEach((a) => {
          lines.push(
            [
              escapeCsvCell(a.id),
              escapeCsvCell(a.severity),
              escapeCsvCell(a.status),
              escapeCsvCell(a.category),
              escapeCsvCell(a.vehicleCode || a.vehicleId || 'N/A'),
              escapeCsvCell(a.riskScorePercent ?? 'N/A'),
              escapeCsvCell(a.title),
              escapeCsvCell(a.currentValue || 'N/A'),
              escapeCsvCell(fmtDateTime(a.timestamp)),
              escapeCsvCell(a.acknowledgedBy || 'N/A'),
            ].join(',')
          );
        });
      }

      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export CSV report');
    }
  };

  // ── Excel XLSX Export Handler ──────────────────────────────────────────
  const handleExportXLSX = () => {
    try {
      setExportError(null);
      const today = new Date().toISOString().split('T')[0];
      const filename = `3rd-Vision-Report-${today}.xlsx`;

      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary & System Health
      const summaryRows = [
        ['3RD VISION SAFETY OPERATIONS REPORT', ''],
        ['Report Generated At', new Date().toISOString()],
        ['Site Name', selectedSite?.name || 'Kirandul Iron Ore Complex'],
        ['Site ID', siteId],
        ['Backend Version', health?.version ? `v${health.version}` : 'N/A'],
        ['Operation Mode', health?.mode || 'N/A'],
        ['Severity Filter', severityFilter],
        ['Date Range Filter', dateRangeFilter],
        ['', ''],
        ['SUMMARY METRICS', ''],
        ['Total Vehicles', totalVehicles],
        ['Vehicles - Safe', byVehicleStatus.SAFE || 0],
        ['Vehicles - Warning', byVehicleStatus.WARNING || 0],
        ['Vehicles - High Risk', byVehicleStatus.HIGH_RISK || 0],
        ['Vehicles - Critical', byVehicleStatus.CRITICAL || 0],
        ['Total Alerts (Filtered)', filteredAlerts.length],
        ['Active Alerts', activeAlertsCount],
        ['Critical Alerts', criticalAlertsCount],
        ['High Alerts', highAlertsCount],
        ['Warning Alerts', warningAlertsCount],
        ['Resolved Alerts', resolvedAlertsCount],
        ['', ''],
        ['HARDWARE STATUS', ''],
        ['Connection State', hw?.connectionState || 'N/A'],
        ['Serial Port', hw?.serialPort || 'N/A'],
        ['Baud Rate', hw?.baudRate ? `${hw.baudRate} bps` : 'N/A'],
        ['Packets Received', hw?.packetCount ?? 'N/A'],
        ['Last Distance (cm)', raw?.distanceCm != null ? raw.distanceCm : 'N/A'],
        ['Last Distance (m)', raw?.distanceM != null ? raw.distanceM : 'N/A'],
        ['Approach Rate (m/s)', derived?.approachRateMps != null ? derived.approachRateMps : 'N/A'],
        ['Motion State', derived?.motionState || 'N/A'],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Sheet 2: Vehicles
      const vehicleRows = vehicles.map((v) => ({
        'Vehicle ID': v.id || 'N/A',
        Code: v.code || 'N/A',
        Name: v.name || 'N/A',
        Type: v.type || 'N/A',
        Status: v.status || 'N/A',
        'Risk Score (%)': v.telemetry?.riskScorePercent ?? 'N/A',
        'Speed (km/h)': v.telemetry?.speedKmh ?? 'N/A',
        'Recommended Speed (km/h)': v.telemetry?.recommendedSpeedKmh ?? 'N/A',
        'Nearest Distance (m)': v.telemetry?.nearestVehicleDistanceMeters ?? 'N/A',
        Zone: v.assignedZoneName || v.zoneId || 'N/A',
        Operator: v.driverName || v.operatorName || 'N/A',
      }));
      const wsVehicles = XLSX.utils.json_to_sheet(
        vehicleRows.length > 0
          ? vehicleRows
          : [{ 'Vehicle ID': 'N/A', Code: 'No vehicles registered', Name: 'N/A' }]
      );
      XLSX.utils.book_append_sheet(wb, wsVehicles, 'Vehicles');

      // Sheet 3: Alerts
      const alertRows = filteredAlerts.map((a) => ({
        'Alert ID': a.id || 'N/A',
        Severity: a.severity || 'N/A',
        Status: a.status || 'N/A',
        Category: a.category || 'N/A',
        'Vehicle Code': a.vehicleCode || a.vehicleId || 'N/A',
        'Risk Score (%)': a.riskScorePercent ?? 'N/A',
        Title: a.title || 'N/A',
        'Current Value': a.currentValue || 'N/A',
        Timestamp: fmtDateTime(a.timestamp),
        'Acknowledged By': a.acknowledgedBy || 'N/A',
      }));
      const wsAlerts = XLSX.utils.json_to_sheet(
        alertRows.length > 0
          ? alertRows
          : [{ 'Alert ID': 'N/A', Severity: 'N/A', Title: 'No alerts match current filter' }]
      );
      XLSX.utils.book_append_sheet(wb, wsAlerts, 'Alerts');

      XLSX.writeFile(wb, filename);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export Excel report');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-mono text-slate-500">Loading operations report data…</p>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <h2 className="text-xl font-bold text-slate-900">Unable to reach backend</h2>
        <p className="text-sm text-slate-500 font-mono">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setRefreshKey((k) => k + 1);
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                REPORTS
              </span>
              <span className="text-xs font-mono text-slate-400">Real-time Operations Telemetry</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              3rd Vision Operations Report
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {selectedSite?.name || 'Kirandul Iron Ore Complex'} · {health?.mode || 'N/A'} · v
              {health?.version || 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-mono font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </button>
          <button
            onClick={handleExportXLSX}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-300 text-xs font-mono font-bold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Download Excel
          </button>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {refreshedAt && (
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {fmtTime(refreshedAt.toISOString())}
            </span>
          )}
        </div>
      </div>

      {exportError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Export Error: {exportError}</span>
        </div>
      )}

      {/* ── Filters Bar ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
            Filter Reports:
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Severity:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'WARNING', 'INFO'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                  severityFilter === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-slate-400">Time Range:</span>
            {(['ALL', '1H', '24H', '7D'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRangeFilter(r)}
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                  dateRangeFilter === r
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {r === 'ALL' ? 'All Time' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fleet Summary ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-slate-400" /> Fleet Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Total Vehicles" value={totalVehicles} sub="Registered fleet" />
          <StatBox label="Safe" value={byVehicleStatus.SAFE || 0} cls="text-emerald-700" sub="Operating normally" />
          <StatBox label="Warning" value={byVehicleStatus.WARNING || 0} cls="text-amber-700" sub="Elevated risk" />
          <StatBox
            label="High Risk / Critical"
            value={(byVehicleStatus.HIGH_RISK || 0) + (byVehicleStatus.CRITICAL || 0)}
            cls={(byVehicleStatus.HIGH_RISK || 0) + (byVehicleStatus.CRITICAL || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}
            sub="Requires attention"
          />
        </div>
      </div>

      {/* ── Alert Summary ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400" /> Alert Summary ({filteredAlerts.length} matching)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Total Filtered" value={filteredAlerts.length} sub="Current criteria" />
          <StatBox label="Active" value={activeAlertsCount} cls={activeAlertsCount > 0 ? 'text-red-600' : 'text-emerald-600'} sub="Action required" />
          <StatBox label="Critical" value={criticalAlertsCount} cls={criticalAlertsCount > 0 ? 'text-red-700 font-black' : 'text-slate-700'} sub="Highest severity" />
          <StatBox label="Resolved" value={resolvedAlertsCount} cls="text-emerald-700" sub="Closed" />
        </div>
      </div>

      {/* ── Hardware Telemetry Summary ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-slate-400" /> Hardware Telemetry Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatBox
            label="Packets Received"
            value={hw?.packetCount?.toLocaleString() ?? 'N/A'}
            sub={hw?.connected ? 'Hardware connected' : 'Hardware disconnected'}
            cls={hw?.connected ? 'text-emerald-700' : 'text-slate-500'}
          />
          <StatBox
            label="Serial Port"
            value={hw?.serialPort ?? 'N/A'}
            sub={hw?.baudRate ? `${hw.baudRate} baud` : '—'}
          />
          <StatBox
            label="Connection State"
            value={hw?.connectionState ?? 'N/A'}
            cls={hw?.connectionState === 'CONNECTED' ? 'text-emerald-700' : 'text-slate-500'}
          />
          <StatBox
            label="Last Distance (HC-SR04)"
            value={raw?.distanceCm != null ? `${Number(raw.distanceCm).toFixed(2)} cm` : 'N/A'}
            sub={raw?.distanceM != null ? `${Number(raw.distanceM).toFixed(3)} m` : undefined}
            cls="text-blue-700"
          />
          <StatBox
            label="Approach Rate"
            value={derived?.approachRateMps != null ? `${Number(derived.approachRateMps).toFixed(3)} m/s` : 'N/A'}
            sub="Time-differentiated"
          />
          <StatBox
            label="Motion State"
            value={derived?.motionState ?? 'N/A'}
            cls={
              derived?.motionState === 'HIGH_VIBRATION'
                ? 'text-red-600'
                : derived?.motionState === 'IN_MOTION'
                ? 'text-amber-600'
                : 'text-emerald-600'
            }
          />
        </div>
        <p className="text-[10px] font-mono text-slate-400 mt-2 px-1">
          ℹ Telemetry sourced directly from physical sensor nodes (HC-SR04 + MPU6500) via unified backend pipeline.
        </p>
      </div>

      {/* ── System Health & Filtered Alerts Table ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide mb-3">
            Backend Services Health
          </h3>
          {health ? (
            <>
              <ServiceRow name="Database (Supabase)" status={health.services.database} />
              <ServiceRow name="Hardware Gateway" status={health.services.hardware} />
              <ServiceRow name="Weather Service" status={health.services.weather} />
              <ServiceRow name="ML Risk Service" status={health.services.ml} />
              <ServiceRow name="Real-time (Socket.IO)" status={health.services.realtime || 'ACTIVE'} />
            </>
          ) : (
            <p className="text-sm text-slate-400 font-mono">No data available</p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wide">
              Filtered Alerts Log
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Showing {filteredAlerts.length} record{filteredAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              <p className="text-slate-400 text-sm font-mono">No alerts match current filter criteria</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filteredAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs font-mono"
                >
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      a.severity === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : a.severity === 'HIGH'
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : a.severity === 'WARNING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      a.status === 'ACTIVE'
                        ? 'bg-red-50 text-red-600 border-red-100'
                        : a.status === 'ACKNOWLEDGED'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}
                  >
                    {a.status}
                  </span>
                  <span className="text-slate-600 font-bold truncate max-w-[120px]">
                    {a.vehicleCode || a.vehicleId || a.title}
                  </span>
                  <span className="text-slate-400 flex-1 truncate">{a.title}</span>
                  <span className="text-slate-400 shrink-0">{fmtTime(a.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
