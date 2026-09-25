import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { Vehicle, Sensor, MiningZone } from '../../types';
import {
  Truck,
  Cpu,
  Layers,
  MapPin,
  X,
  Gauge,
  ShieldCheck,
  Fuel,
  Thermometer,
  Radio,
  AlertTriangle,
  Satellite,
  Map as MapIcon,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { HaulRoad, VehicleTrail } from './GoogleFleetMap';

export interface LeafletFleetMapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  vehicles?: Vehicle[];
  sensors?: Sensor[];
  zones?: MiningZone[];
  riskZones?: MiningZone[];
  haulRoads?: HaulRoad[];
  vehicleTrails?: VehicleTrail[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onSelectSensor?: (sensor: Sensor) => void;
  onSelectZone?: (zone: MiningZone) => void;
  height?: string;
  className?: string;
  isGoogleMapsAvailable?: boolean;
  activeEngine?: 'leaflet' | 'google-maps';
  onToggleEngine?: () => void;
}

// Basemap URL configs
const BASEMAP_TILES = {
  hybrid: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  roadmap: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Topographic Basemap',
    maxZoom: 19,
  },
};

export const LeafletFleetMap: React.FC<LeafletFleetMapProps> = ({
  center = [18.6312, 81.2485],
  zoom = 15,
  vehicles = [],
  sensors = [],
  zones: propZones,
  riskZones: propRiskZones,
  haulRoads: propHaulRoads,
  vehicleTrails: propVehicleTrails,
  selectedVehicleId,
  onSelectVehicle,
  onSelectSensor,
  onSelectZone,
  height = 'h-[540px]',
  className = '',
  isGoogleMapsAvailable: _isGoogleMapsAvailable = false,
  activeEngine: _activeEngine = 'leaflet',
  onToggleEngine: _onToggleEngine,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups for clean, high-performance updates
  const haulRoadsGroupRef = useRef<L.LayerGroup | null>(null);
  const trailsGroupRef = useRef<L.LayerGroup | null>(null);
  const zonesGroupRef = useRef<L.LayerGroup | null>(null);
  const sensorsGroupRef = useRef<L.LayerGroup | null>(null);
  const vehiclesGroupRef = useRef<L.LayerGroup | null>(null);

  // Overlay state toggles
  const [showHaulRoads, setShowHaulRoads] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showZones, setShowZones] = useState(true);

  // Basemap style
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'terrain'>('hybrid');
  const [panelOpen, setPanelOpen] = useState(true);

  // Vehicle selection
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const effectiveVehicleId = selectedVehicleId !== undefined ? selectedVehicleId : internalSelectedId;
  const activeVehicle = useMemo(() => {
    if (!effectiveVehicleId) return null;
    return vehicles.find((v) => v.id === effectiveVehicleId) || null;
  }, [effectiveVehicleId, vehicles]);

  const activeZones = useMemo(() => propZones || propRiskZones || [], [propZones, propRiskZones]);

  // Default haul roads anchored around Kirandul if not provided
  const haulRoads = useMemo(() => {
    if (propHaulRoads && propHaulRoads.length > 0) return propHaulRoads;
    const lat = center[0];
    const lng = center[1];
    return [
      {
        id: 'road-primary-ramp',
        name: 'Main Haul Ramp #1 (8% Gradient)',
        coords: [
          [lat + 0.0055, lng - 0.0062],
          [lat + 0.0028, lng - 0.0025],
          [lat - 0.0008, lng + 0.0008],
          [lat - 0.0042, lng + 0.0032],
        ] as [number, number][],
      },
      {
        id: 'road-crusher-feeder',
        name: 'Primary Crusher Feeder & Loop',
        coords: [
          [lat - 0.0008, lng + 0.0008],
          [lat - 0.0032, lng - 0.0022],
          [lat - 0.0061, lng + 0.0012],
          [lat - 0.0048, lng + 0.0042],
        ] as [number, number][],
      },
      {
        id: 'road-pit-bench-b4',
        name: 'Pit Bench B-4 Cutting Route',
        coords: [
          [lat + 0.0045, lng + 0.0022],
          [lat + 0.0015, lng + 0.0035],
          [lat - 0.0015, lng + 0.0018],
          [lat - 0.0042, lng + 0.0032],
        ] as [number, number][],
      },
    ];
  }, [propHaulRoads, center]);

  // Default vehicle trails if not provided
  const vehicleTrails = useMemo(() => {
    if (propVehicleTrails && propVehicleTrails.length > 0) return propVehicleTrails;
    return vehicles
      .filter((v) => v.telemetry.latitude != null && v.telemetry.longitude != null)
      .map((v) => {
        const lat = v.telemetry.latitude!;
        const lng = v.telemetry.longitude!;
        const headingRad = (((v.telemetry.heading ?? 0) - 180) * Math.PI) / 180;
        return {
          id: `trail-${v.id}`,
          vehicleId: v.id,
          color:
            v.status === 'CRITICAL'
              ? '#EF4444'
              : v.status === 'HIGH_RISK' || v.status === 'WARNING'
              ? '#F59E0B'
              : '#10B981',
          coords: [
            [lat + Math.sin(headingRad) * 0.0018, lng + Math.cos(headingRad) * 0.0018],
            [lat + Math.sin(headingRad) * 0.0009, lng + Math.cos(headingRad) * 0.0009],
            [lat, lng],
          ] as [number, number][],
        };
      });
  }, [propVehicleTrails, vehicles]);

  const handleVehicleClick = useCallback(
    (veh: Vehicle) => {
      setInternalSelectedId(veh.id);
      setPanelOpen(false);
      onSelectVehicle?.(veh);
      if (mapInstanceRef.current && veh.telemetry.latitude != null && veh.telemetry.longitude != null) {
        mapInstanceRef.current.panTo([veh.telemetry.latitude, veh.telemetry.longitude], {
          animate: true,
          duration: 0.6,
        });
      }
    },
    [onSelectVehicle]
  );

  // 1. Initialize Map Instance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) {
      delete (container as unknown as { _leaflet_id?: number })._leaflet_id;
    }

    const map = L.map(container, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: true,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create persistent Layer Groups
    haulRoadsGroupRef.current = L.layerGroup().addTo(map);
    trailsGroupRef.current = L.layerGroup().addTo(map);
    zonesGroupRef.current = L.layerGroup().addTo(map);
    sensorsGroupRef.current = L.layerGroup().addTo(map);
    vehiclesGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Trigger invalidateSize to fix any sizing issues inside flex/grid containers
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Basemap Updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = BASEMAP_TILES[mapType];
    const newTile = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newTile;
  }, [mapType]);

  // 3. Render Haul Roads
  useEffect(() => {
    const group = haulRoadsGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showHaulRoads) return;

    haulRoads.forEach((road) => {
      const polyline = L.polyline(road.coords, {
        color: '#F59E0B',
        weight: 4,
        opacity: 0.85,
        dashArray: '7, 7',
        lineCap: 'round',
        lineJoin: 'round',
      });

      polyline.bindTooltip(
        `<div class="font-sans font-bold text-xs text-slate-900">${road.name}</div>`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );

      polyline.addTo(group);
    });
  }, [haulRoads, showHaulRoads]);

  // 4. Render Vehicle Trails
  useEffect(() => {
    const group = trailsGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showTrails) return;

    vehicleTrails.forEach((trail) => {
      const line = L.polyline(trail.coords, {
        color: trail.color,
        weight: 2.5,
        opacity: 0.65,
        dashArray: '4, 4',
      });
      line.addTo(group);
    });
  }, [vehicleTrails, showTrails]);

  // 5. Render Operational Risk Zones
  useEffect(() => {
    const group = zonesGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showZones) return;

    activeZones.forEach((zone) => {
      if (!zone.polygonCoordinates || zone.polygonCoordinates.length < 3) return;

      const color =
        zone.riskLevel === 'EXTREME'
          ? '#EF4444'
          : zone.riskLevel === 'HIGH'
          ? '#F97316'
          : zone.riskLevel === 'MEDIUM'
          ? '#EAB308'
          : '#10B981';

      const polygon = L.polygon(zone.polygonCoordinates, {
        color: color,
        fillColor: color,
        fillOpacity: 0.18,
        weight: 2,
        dashArray: zone.isRestricted ? '5, 5' : undefined,
      });

      polygon.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px 4px;">
          <div style="font-weight: 800; color: ${color};">${zone.name}</div>
          <div style="color: #475569; font-size: 10px;">Speed Limit: ${zone.maxSpeedLimit} km/h • Risk: ${zone.riskLevel}</div>
        </div>`,
        { sticky: true }
      );

      polygon.on('click', () => {
        onSelectZone?.(zone);
      });

      polygon.addTo(group);
    });
  }, [activeZones, showZones, onSelectZone]);

  // 6. Render IoT Sensors & Coverage Radii
  useEffect(() => {
    const group = sensorsGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showSensors) return;

    sensors.forEach((sns) => {
      const lat = sns.telemetry?.gps?.latitude || center[0] + 0.0012;
      const lng = sns.telemetry?.gps?.longitude || center[1] + 0.0012;
      const color = sns.status === 'ONLINE' ? '#2563EB' : '#DC2626';

      // Coverage Radius Circle
      const circle = L.circle([lat, lng], {
        radius: sns.detectionRangeMeters || 40,
        color: color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.08,
      });
      circle.addTo(group);

      // Sensor Marker
      const sensorIcon = L.divIcon({
        className: 'custom-sensor-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
            <div style="width: 22px; height: 22px; border-radius: 9999px; background: #FFFFFF; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
              <div style="width: 7px; height: 7px; border-radius: 9999px; background: ${color};"></div>
            </div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: sensorIcon });
      marker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px;">
          <strong>${sns.name}</strong> (${sns.type})
          <div style="color:${color}; font-weight:700; font-size:10px;">${sns.status} • Coverage: ${sns.detectionRangeMeters || 40}m</div>
        </div>`,
        { sticky: true }
      );

      marker.on('click', () => {
        onSelectSensor?.(sns);
      });

      marker.addTo(group);
    });
  }, [sensors, showSensors, center, onSelectSensor]);

  // 7. Render Fleet Vehicles with Dynamic Headings & Status
  useEffect(() => {
    const group = vehiclesGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showVehicles) return;

    vehicles.forEach((veh) => {
      const lat = veh.telemetry?.latitude;
      const lng = veh.telemetry?.longitude;
      if (lat == null || lng == null) return;

      const isSelected = veh.id === activeVehicle?.id;
      const status = veh.status;
      const color =
        status === 'CRITICAL'
          ? '#DC2626'
          : status === 'HIGH_RISK' || status === 'WARNING'
          ? '#F59E0B'
          : '#16A34A';
      const heading = veh.telemetry?.heading || 0;
      const speed = veh.telemetry?.speedKmh || 0;
      const code = veh.code || veh.name;

      const vehicleIcon = L.divIcon({
        className: 'custom-fleet-vehicle-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
            ${
              status === 'CRITICAL'
                ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; top: -6px;"></div>`
                : ''
            }
            <div style="width: 32px; height: 32px; border-radius: 10px; background: #0F172A; border: 2.5px solid ${color}; box-shadow: 0 4px 10px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; position: relative; ${
              isSelected ? 'outline: 3px solid #3B82F6; outline-offset: 2px;' : ''
            }">
              <svg style="width: 17px; height: 17px; color: ${color}; transform: rotate(${heading}deg); transition: transform 0.3s ease;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
              </svg>
            </div>
            <div style="margin-top: 3px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(4px); border: 1px solid ${color}; border-radius: 6px; padding: 1px 6px; font-family: monospace; font-size: 10px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">
              <span>${code}</span>
              <span style="color: ${color}; font-size: 9px;">${speed}km/h</span>
            </div>
          </div>
        `,
        iconSize: [42, 54],
        iconAnchor: [21, 27],
      });

      const marker = L.marker([lat, lng], {
        icon: vehicleIcon,
        zIndexOffset: isSelected ? 1000 : status === 'CRITICAL' ? 800 : 500,
      });

      marker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px 4px;">
          <div style="font-weight: 800; color: #0F172A;">${veh.code} • ${veh.name}</div>
          <div style="color: ${color}; font-weight: 700; font-size: 10px;">${veh.status} • ${speed} km/h • Heading: ${heading}°</div>
          <div style="color: #64748B; font-size: 10px;">Operator: ${veh.operatorName || 'Assigned Driver'}</div>
        </div>`,
        { sticky: true }
      );

      marker.on('click', () => {
        handleVehicleClick(veh);
      });

      marker.addTo(group);
    });
  }, [vehicles, showVehicles, activeVehicle?.id, handleVehicleClick]);

  const resetToKirandul = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  };

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 select-none ${className}`}
    >
      {/* ─── Leaflet Map Viewport Container ─── */}
      <div
        ref={containerRef}
        id="leaflet-fleet-map-container"
        className="w-full h-full z-0"
        style={{ minHeight: '340px' }}
      />

      {/* ─── Top Left Map Type & Reset Selector ─── */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur-md border border-stone-200 rounded-xl p-1 shadow-md max-w-[calc(100%-80px)]">
        <button
          onClick={() => setMapType('hybrid')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            mapType === 'hybrid'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title="High-Resolution Satellite Imagery"
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>
        <button
          onClick={() => setMapType('roadmap')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            mapType === 'roadmap'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
          title="Street & Cartographic Vector Map"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Roads</span>
        </button>
        <button
          onClick={() => setMapType('terrain')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            mapType === 'terrain'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Topographic Elevation Relief"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Terrain</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200 mx-1 hidden sm:block" />

        <button
          onClick={resetToKirandul}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Recenter to Mine Pit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Bottom Left Status Telemetry Ribbon ─── */}
      <div className="absolute bottom-3 left-4 z-[400] flex items-center gap-2 pointer-events-none max-w-[calc(100%-2rem)]">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl text-[11px] font-medium text-slate-200 shadow-lg flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold text-white shrink-0">OpenGIS Active</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-300 truncate">Kirandul Mine Pit ({center[0].toFixed(2)}°N, {center[1].toFixed(2)}°E)</span>
          <span className="text-slate-400">•</span>
          <span className="text-blue-400 font-bold shrink-0">{vehicles.length} Trucks</span>
        </div>
      </div>

      {/* ─── Top Right Layer Control Panel (Hidden when drawer is open to prevent overlapping) ─── */}
      {!activeVehicle && (
        <div className="absolute top-4 right-4 z-[400]">
          {panelOpen ? (
            <div className="bg-white/98 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-lg w-60 sm:w-64 space-y-2.5 text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Map Overlays</span>
                </div>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Collapse overlay controls"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {/* 1. Haul Roads Toggle */}
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-2 text-slate-700 group-hover:text-slate-950 font-medium">
                    <input
                      type="checkbox"
                      checked={showHaulRoads}
                      onChange={(e) => setShowHaulRoads(e.target.checked)}
                      className="rounded accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="w-2.5 h-1 bg-blue-500 rounded-full" />
                    <span>Haul Roads</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    {haulRoads.length}
                  </span>
                </label>

                {/* 2. Fleet Vehicles Toggle */}
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-2 text-slate-700 group-hover:text-slate-950 font-medium">
                    <input
                      type="checkbox"
                      checked={showVehicles}
                      onChange={(e) => setShowVehicles(e.target.checked)}
                      className="rounded accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <Truck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Fleet Vehicles</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    {vehicles.length}
                  </span>
                </label>

                {/* 3. Vehicle Trails Toggle */}
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-2 text-slate-700 group-hover:text-slate-950 font-medium">
                    <input
                      type="checkbox"
                      checked={showTrails}
                      onChange={(e) => setShowTrails(e.target.checked)}
                      className="rounded accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="w-2 h-2 rounded-full border border-dashed border-blue-600" />
                    <span>Vehicle Trails</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    {vehicleTrails.length}
                  </span>
                </label>

                {/* 4. IoT Sensors Toggle */}
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-2 text-slate-700 group-hover:text-slate-950 font-medium">
                    <input
                      type="checkbox"
                      checked={showSensors}
                      onChange={(e) => setShowSensors(e.target.checked)}
                      className="rounded accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span>IoT Sensors</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    {sensors.length}
                  </span>
                </label>

                {/* 5. Risk Zones Toggle */}
                <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-2 text-slate-700 group-hover:text-slate-950 font-medium">
                    <input
                      type="checkbox"
                      checked={showZones}
                      onChange={(e) => setShowZones(e.target.checked)}
                      className="rounded accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                    />
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Risk Zones</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    {activeZones.length}
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setPanelOpen(true)}
              className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 shadow-md text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
              title="Open overlay controls"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Overlays</span>
            </button>
          )}
        </div>
      )}

      {/* ─── Vehicle Detail Side Drawer ─── */}
      {activeVehicle && (
        <aside
          className="absolute inset-y-0 right-0 w-80 sm:w-96 bg-white/98 backdrop-blur-md border-l border-slate-200 shadow-2xl z-[500] p-5 flex flex-col justify-between overflow-y-auto font-sans animate-in slide-in-from-right duration-200"
          aria-label="Vehicle Telemetry Inspector"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                    activeVehicle.status === 'CRITICAL'
                      ? 'bg-red-600'
                      : activeVehicle.status === 'WARNING' || activeVehicle.status === 'HIGH_RISK'
                      ? 'bg-blue-600'
                      : 'bg-emerald-600'
                  }`}
                >
                  <Truck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900">
                      {activeVehicle.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        activeVehicle.status === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : activeVehicle.status === 'HIGH_RISK' || activeVehicle.status === 'WARNING'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {activeVehicle.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{activeVehicle.name}</div>
                </div>
              </div>

              <button
                onClick={() => setInternalSelectedId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operator & Location info */}
            <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <div className="text-slate-500 text-[10px] font-medium">Assigned Operator</div>
                <div className="font-bold text-slate-900 mt-0.5 truncate">
                  {activeVehicle.operatorName || 'Operator Shift A'}
                </div>
                <div className="text-[10px] text-slate-500">{activeVehicle.operatorPhone || '+91 98765 43210'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] font-medium">Current Location</div>
                <div className="font-bold text-slate-900 mt-0.5">Pit Bench Sector</div>
                <div className="text-[10px] text-slate-500">
                  {activeVehicle.telemetry.latitude != null && activeVehicle.telemetry.longitude != null
                    ? `${activeVehicle.telemetry.latitude.toFixed(4)}°, ${activeVehicle.telemetry.longitude.toFixed(4)}°`
                    : 'N/A (No GPS attached)'}
                </div>
              </div>
            </div>

            {/* Speed & Proximity Gauges */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Speed & Proximity Radar
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <Gauge className="w-3.5 h-3.5 text-blue-600" /> Current Speed
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {activeVehicle.telemetry.speedKmh}{' '}
                    <span className="text-xs text-slate-500 font-normal">km/h</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Safe Limit
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {activeVehicle.telemetry.recommendedSpeedKmh}{' '}
                    <span className="text-xs text-slate-500 font-normal">km/h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Proximity Target */}
            {activeVehicle.telemetry.nearestVehicleDistanceMeters != null && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Proximity Target:</span>
                  <span className="font-bold text-slate-900">
                    {activeVehicle.telemetry.nearestVehicleName || 'Leading Vehicle'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-slate-600 font-medium">Headway Distance:</span>
                  <span
                    className={`text-xl font-black ${
                      activeVehicle.telemetry.nearestVehicleDistanceMeters < 10
                        ? 'text-red-700'
                        : activeVehicle.telemetry.nearestVehicleDistanceMeters < 25
                        ? 'text-blue-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {activeVehicle.telemetry.nearestVehicleDistanceMeters}m
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Closing Speed:</span>
                  <span className="text-slate-800 font-bold">
                    {activeVehicle.telemetry.relativeSpeedKmh || 0} km/h
                  </span>
                </div>
              </div>
            )}

            {/* Safety Advisory */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                Active Safety Advisory
              </div>
              <div className="text-xs font-semibold text-slate-800">
                {activeVehicle.telemetry.recommendedAction || 'Maintain standard haulage speed.'}
              </div>
            </div>

            {/* Hardware Telemetry */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Fuel Level</div>
                  <div className="font-bold text-slate-900">{activeVehicle.telemetry.fuelLevelPercent}%</div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-500">Engine Temp</div>
                  <div className="font-bold text-slate-900">{activeVehicle.telemetry.engineTempCelsius}°C</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-700" /> Heading: {activeVehicle.telemetry.heading}°
            </span>
            <span>{new Date(activeVehicle.telemetry.lastUpdate).toLocaleTimeString()}</span>
          </div>
        </aside>
      )}
    </div>
  );
};

export default LeafletFleetMap;
