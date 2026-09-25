import React from 'react';
import { LeafletFleetMap, LeafletFleetMapProps } from './maps/LeafletFleetMap';

export type MapViewProps = LeafletFleetMapProps;

export const MapView: React.FC<MapViewProps> = (props) => {
  return <LeafletFleetMap {...props} />;
};

export default MapView;

