import React from 'react';
import { Vehicle, Sensor, MiningZone } from '../../types';
import { LeafletFleetMap } from './LeafletFleetMap';

export interface HaulRoad {
  id: string;
  name: string;
  coords: [number, number][]; // [lat, lng]
}

export interface VehicleTrail {
  id: string;
  vehicleId: string;
  color: string;
  coords: [number, number][]; // [lat, lng]
}

export interface GoogleFleetMapProps {
  center?: [number, number]; // [lat, lng] (default: Kirandul [18.6312, 81.2485])
  zoom?: number;
  vehicles?: Vehicle[];
  sensors?: Sensor[];
  zones?: MiningZone[];
  riskZones?: MiningZone[]; // Support both prop names
  haulRoads?: HaulRoad[];
  vehicleTrails?: VehicleTrail[];
  selectedVehicleId?: string | null;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onSelectSensor?: (sensor: Sensor) => void;
  onSelectZone?: (zone: MiningZone) => void;
  height?: string;
  className?: string;
}

/**
 * GoogleFleetMap adapter: Delegates directly to LeafletFleetMap (OpenGIS)
 * ensuring full interactive GIS mapping without requiring Google Maps API.
 */
export const GoogleFleetMap: React.FC<GoogleFleetMapProps> = (props) => {
  return <LeafletFleetMap {...props} />;
};

export default GoogleFleetMap;

