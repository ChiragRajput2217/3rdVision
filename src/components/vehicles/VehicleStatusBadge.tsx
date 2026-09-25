import React from 'react';
import { VehicleStatus } from '../../types';
import { Badge } from '../ui/Badge';

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const VehicleStatusBadge: React.FC<VehicleStatusBadgeProps> = ({ status, size = 'md' }) => {
  return <Badge status={status} size={size} />;
};
