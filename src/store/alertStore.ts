import { create } from 'zustand';
import { Alert, AlertSeverity, AlertStatus } from '../types';
import { MOCK_ALERTS } from '../services/mockData';

interface AlertStoreState {
  alerts: Alert[];
  severityFilter: AlertSeverity | 'ALL';
  statusFilter: AlertStatus | 'ALL';

  // Actions
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string, username: string) => void;
  escalateAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  setSeverityFilter: (severity: AlertSeverity | 'ALL') => void;
  setStatusFilter: (status: AlertStatus | 'ALL') => void;
}

export const useAlertStore = create<AlertStoreState>((set) => ({
  alerts: MOCK_ALERTS,
  severityFilter: 'ALL',
  statusFilter: 'ALL',

  addAlert: (newAlert: Alert) => {
    set((state) => ({
      alerts: [newAlert, ...state.alerts.filter((a) => a.id !== newAlert.id)],
    }));
  },

  acknowledgeAlert: (alertId: string, username: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'ACKNOWLEDGED' as AlertStatus,
              acknowledgedBy: username,
              acknowledgedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
  },

  escalateAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'ESCALATED' as AlertStatus } : a
      ),
    }));
  },

  resolveAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'RESOLVED' as AlertStatus } : a
      ),
    }));
  },

  setSeverityFilter: (severity) => set({ severityFilter: severity }),
  setStatusFilter: (status) => set({ statusFilter: status }),
}));
