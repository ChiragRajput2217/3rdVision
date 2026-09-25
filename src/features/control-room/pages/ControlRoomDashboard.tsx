import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useSiteStore } from '../../../store/siteStore';
import { useAlertStore } from '../../../store/alertStore';
import { useVehicles } from '../../../hooks/useVehicles';
import { useSensors } from '../../../hooks/useSensors';
import { LeafletFleetMap } from '../../../components/maps/LeafletFleetMap';
import { AlertCard } from '../../../components/alerts/AlertCard';
import { Button } from '../../../components/ui/Button';
import { MOCK_VEHICLES } from '../../../services/mockData';
import {
  Radio,
  Flame,
  AlertTriangle,
  Truck,
  Eye,
  Lock,
  Send,
  Zap,
} from 'lucide-react';

export const ControlRoomDashboard: React.FC = () => {
  const { selectedSiteId } = useAuth();
  const { selectedSite, zones, updateZoneRisk } = useSiteStore();
  const { alerts } = useAlertStore();
  const { vehicles } = useVehicles(selectedSiteId);
  const { sensors } = useSensors(selectedSiteId);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const selectedVehicle = (selectedVehicleId ? vehicles.find((v) => v.id === selectedVehicleId) : null) || vehicles[0] || MOCK_VEHICLES[0];

  const activeCriticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');

  const handleAlertVehicle = (vehCode: string) => {
    alert(`⚡ In-Cab Warning Broadcast sent to Vehicle ${vehCode}: REDUCE SPEED IMMEDIATELY!`);
  };

  const handleRestrictZone = (zoneId: string) => {
    updateZoneRisk(zoneId, 'EXTREME');
    alert(`🚨 Zone ${zoneId} has been set to RESTRICTED / EXTREME RISK.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      
      {/* Top Banner: "What is happening now? What is dangerous? What action should be taken?" */}
      <div className="bg-white border border-red-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold shadow-sm animate-pulse">
              <Radio className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  CRITICAL COMMAND CENTER
                </span>
                <span className="text-xs font-mono text-slate-500">Mine: {selectedSite.name}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Real-Time Intervention Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-700">
              <span className="text-slate-500">Visibility:</span> <span className="font-bold text-slate-900">{selectedSite.currentCondition.visibilityMeters}m</span>
            </div>
            <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-700">
              <span className="text-slate-500">Critical Alerts:</span> <span className="font-bold text-red-600">{activeCriticalAlerts.length} Active</span>
            </div>
          </div>
        </div>

        {/* 3 Operational Priority Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono pt-2">
          
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="text-[10px] text-blue-700 uppercase font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> 1. What is happening now?
            </div>
            <div className="text-slate-700 font-medium">
              Dense mountain fog at Bench B-4. Haul Dumper D-104 descending ramp at 18 km/h.
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="text-[10px] text-red-700 uppercase font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> 2. What is dangerous?
            </div>
            <div className="text-slate-700 font-medium">
              Head-on closing vector between D-104 & D-108 in 3.2m visibility. 91% ML Collision Risk.
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
            <div className="text-[10px] text-emerald-700 uppercase font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> 3. What action should be taken?
            </div>
            <div className="text-slate-700 font-medium">
              Issue 8 km/h in-cab advisory override & instruct D-104 to shift to left turnout bench.
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Interactive Map + Real-time Telemetry Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Live Mine Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Live Mine Vector Map</h2>
            </div>
            <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              Socket.IO Vector Stream Active
            </span>
          </div>

          <LeafletFleetMap
            center={selectedSite?.coordinates || [18.6312, 81.2485]}
            vehicles={vehicles}
            sensors={sensors}
            zones={zones}
            selectedVehicleId={selectedVehicle.id}
            onSelectVehicle={(v) => setSelectedVehicleId(v.id)}
            height="h-[600px]"
          />
        </div>

        {/* Right Side: Selected Vehicle Telemetry & ML Prediction Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Vehicle In-Cab Inspector</h2>
            </div>
            <span className="text-xs font-mono text-blue-600 font-bold">Selected: {selectedVehicle.code}</span>
          </div>

          {/* Detailed Telemetry Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-2xl font-black text-slate-900 font-mono">{selectedVehicle.code}</div>
                <div className="text-xs text-slate-500">{selectedVehicle.name}</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-500">Risk Score</div>
                <div className="text-3xl font-extrabold text-red-600">{selectedVehicle.telemetry.riskScorePercent}%</div>
              </div>
            </div>

            {/* Speeds & Visibility */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">Current Speed</div>
                <div className="text-xl font-bold text-slate-900">{selectedVehicle.telemetry.speedKmh} km/h</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">Recommended Speed</div>
                <div className="text-xl font-bold text-blue-700">{selectedVehicle.telemetry.recommendedSpeedKmh} km/h</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">Nearest Vehicle</div>
                <div className="text-sm font-bold text-slate-800">
                  {selectedVehicle.telemetry.nearestVehicleDistanceMeters}m ({selectedVehicle.telemetry.nearestVehicleName || 'D-108'})
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">Relative Speed</div>
                <div className="text-sm font-bold text-red-600">
                  {selectedVehicle.telemetry.relativeSpeedKmh} km/h
                </div>
              </div>
            </div>

            {/* ML Risk Factors */}
            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-500 uppercase font-bold">ML Risk Prediction Factors</div>
              <div className="space-y-1">
                {selectedVehicle.telemetry.riskFactors.map((factor, i) => (
                  <div key={i} className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action Prompt */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <div className="text-[10px] font-mono text-blue-800 uppercase font-bold">Operator Advisory Prompt</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedVehicle.telemetry.recommendedAction}</div>
            </div>

            {/* Control Actions: Acknowledge, Alert Vehicle, Restrict Zone, Escalate */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Button
                variant="warning"
                size="sm"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={() => handleAlertVehicle(selectedVehicle.code)}
              >
                Alert Vehicle Cab
              </Button>

              <Button
                variant="danger"
                size="sm"
                icon={<Lock className="w-3.5 h-3.5" />}
                onClick={() => handleRestrictZone(selectedVehicle.zoneId)}
              >
                Restrict Zone B-4
              </Button>
            </div>

          </div>

          {/* Active Critical Alerts Drawer in Command Center */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
              Active Command Center Alerts ({activeCriticalAlerts.length})
            </h3>
            {activeCriticalAlerts.map((a) => (
              <AlertCard key={a.id} alert={a} compact />
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
