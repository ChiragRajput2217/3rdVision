import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { LeafletFleetMap } from '../../../components/maps/LeafletFleetMap';
import { VehicleCard } from '../../../components/VehicleCard';
import { Flame, ShieldAlert } from 'lucide-react';

export const RiskMap: React.FC = () => {
  const { vehicles, sensors, zones } = useAppStore();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold shadow-xs">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Interactive Mine Risk Heatmap & Fleet Tracker
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              Live Collision Trajectories & Geo-fenced Risk Zones Assessment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            OpenGIS Leaflet Engine Active
          </span>
        </div>
      </div>

      {/* Main Map */}
      <LeafletFleetMap vehicles={vehicles} sensors={sensors} zones={zones} height="h-[550px]" />


      {/* High Risk Vehicle Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
          <h3 className="font-extrabold text-stone-900 text-lg tracking-tight">
            Tracked Fleet Vehicles in High-Risk Zones
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      </div>
    </div>
  );
};
