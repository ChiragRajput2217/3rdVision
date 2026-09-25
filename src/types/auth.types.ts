export type UserRole = 
  | 'SUPER_ADMIN'
  | 'SITE_ADMIN'
  | 'CONTROL_ROOM_OPERATOR'
  | 'VEHICLE_OPERATOR'
  | 'MANAGEMENT';

export interface UserPermission {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  assignedSiteIds: string[];
  assignedVehicleId?: string;
  permissions: string[];
  lastLoginAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  region: string;
  totalSites: number;
  totalVehicles: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface MiningSite {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  location: string;
  state: string;
  coordinates: [number, number]; // [lat, lng]
  status: 'OPERATIONAL' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE';
  currentCondition: EnvironmentalConditionSummary;
  totalVehicles: number;
  totalSensors: number;
  activeAlertsCount: number;
}

export interface EnvironmentalConditionSummary {
  visibilityMeters: number;
  fogLevelPercent: number;
  humidityPercent: number;
  temperatureCelsius: number;
  status: 'CLEAR' | 'MODERATE_FOG' | 'DENSE_FOG' | 'HEAVY_RAIN' | 'HIGH_DUST';
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  firebaseToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedSiteId: string;
  error: string | null;
}
