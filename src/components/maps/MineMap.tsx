import React from 'react';
import { LeafletFleetMap, LeafletFleetMapProps } from './LeafletFleetMap';

export type MineMapProps = LeafletFleetMapProps;

export const MineMap: React.FC<MineMapProps> = (props) => {
  return <LeafletFleetMap {...props} />;
};

export default MineMap;

