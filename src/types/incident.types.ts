import { AlertSeverity } from './alert.types';

export interface Incident {
  id: string;
  siteId: string;
  incidentNumber: string; // e.g. INC-2026-089
  title: string;
  severity: AlertSeverity;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  vehicleIds: string[];
  vehicleCodes: string[];
  zoneId: string;
  zoneName: string;
  riskScore: number;
  description: string;
  rootCause?: string;
  preventativeAction?: string;
  createdAt: string;
  timestamp?: string;
  resolvedAt?: string;
}
