import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  UserRole,
  MiningSite,
  MiningZone,
  Vehicle,
  Sensor,
  Alert,
  Incident,
  SimulationScenario,
} from '../types';
import { simulationEngine } from '../services/simulation';
import { signInWithGoogle, signOutFirebase } from '../services/firebase.service';
import { verifyFirebaseIdToken } from '../features/auth/auth.api';
import { MOCK_USERS } from '../services/mockData';

export interface AppStoreState {
  // Demo & Auth state
  isDemoMode: boolean;
  demoSession: {
    demo: boolean;
    role: UserRole;
    user: { id: string; name: string; email: string };
    siteId: string | number;
  } | null;
  user: User | null;
  firebaseToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedSiteId: string;
  authError: string | null;

  // Simulation state
  sites: MiningSite[];
  zones: MiningZone[];
  vehicles: Vehicle[];
  sensors: Sensor[];
  alerts: Alert[];
  incidents: Incident[];
  activeScenario: SimulationScenario;
  isPlaying: boolean;
  speedMs: number;
  connectionStatus: 'LIVE' | 'SIMULATION' | 'CONNECTING' | 'OFFLINE';

  // UI state
  sidebarOpen: boolean;
  notificationsOpen: boolean;

  // Actions - Auth & Demo
  loginWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginAsDemoRole: (role: UserRole) => void;
  switchDemoRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  setSelectedSiteId: (siteId: string) => void;
  clearAuthError: () => void;

  // Actions - Simulation
  setScenario: (scenario: SimulationScenario) => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speedMs: number) => void;
  acknowledgeAlert: (alertId: string, acknowledgedBy: string) => void;
  resolveAlert: (alertId: string) => void;
  updateVehicleSpeed: (vehicleId: string, speedKmh: number) => void;
  restrictZone: (zoneId: string) => void;

  // Actions - UI
  toggleSidebar: () => void;
  toggleNotifications: () => void;

  // Internal sync
  syncWithSimulation: () => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => {
      // Subscribe to central simulation engine updates asynchronously after store creation completes
      setTimeout(() => {
        simulationEngine.subscribe((simState) => {
          set({
            sites: simState.sites,
            zones: simState.zones,
            vehicles: simState.vehicles,
            sensors: simState.sensors,
            alerts: simState.alerts,
            incidents: simState.incidents,
            activeScenario: simState.activeScenario,
            isPlaying: simState.isPlaying,
            speedMs: simState.speedMs,
          });
        });
      }, 0);

      const initialSimState = simulationEngine.getState();

      return {
        // Initial Auth & Demo State
        isDemoMode: import.meta.env.VITE_DEMO_MODE !== 'false',
        demoSession: {
          demo: true,
          role: 'SITE_ADMIN' as UserRole,
          user: {
            id: 'demo-site-admin',
            name: 'Demo Site Administrator',
            email: 'demo@3rdvision.local',
          },
          siteId: 1,
        },
        user: MOCK_USERS['SITE_ADMIN'],
        firebaseToken: 'demo-token-site-admin',
        isAuthenticated: true,
        isLoading: false,
        selectedSiteId: 'site-kirandul-01',
        authError: null,

        // Initial Simulation State
        sites: initialSimState.sites,
        zones: initialSimState.zones,
        vehicles: initialSimState.vehicles,
        sensors: initialSimState.sensors,
        alerts: initialSimState.alerts,
        incidents: initialSimState.incidents,
        activeScenario: initialSimState.activeScenario,
        isPlaying: initialSimState.isPlaying,
        speedMs: initialSimState.speedMs,
        connectionStatus: 'SIMULATION',

        // Initial UI state
        sidebarOpen: true,
        notificationsOpen: false,

        // Auth Actions
        loginWithGoogle: async (preferredRole?: UserRole) => {
          set({ isLoading: true, authError: null });
          try {
            const { firebaseUser, idToken } = await signInWithGoogle();
            const authData = await verifyFirebaseIdToken(idToken, preferredRole);

            const finalUser: User = {
              ...authData.user,
              email: firebaseUser.email || authData.user.email,
              displayName: firebaseUser.displayName || authData.user.displayName,
              photoURL: firebaseUser.photoURL || authData.user.photoURL,
            };

            set({
              user: finalUser,
              firebaseToken: idToken,
              isAuthenticated: true,
              selectedSiteId: finalUser.assignedSiteIds[0] || 'site-kirandul-01',
              isLoading: false,
              authError: null,
            });
          } catch (err: any) {
            console.warn('Google sign-in fallback triggered:', err);
            const fallbackRole = preferredRole || 'SITE_ADMIN';
            const mockUser = MOCK_USERS[fallbackRole];
            set({
              user: mockUser,
              firebaseToken: 'mock-firebase-id-token-fallback',
              isAuthenticated: true,
              selectedSiteId: mockUser.assignedSiteIds[0] || 'site-kirandul-01',
              isLoading: false,
              authError: null,
            });
          }
        },

        loginWithEmail: async (email: string, password: string) => {
          set({ isLoading: true, authError: null });
          // Dev bypass: chirag@gmail.com / 123 → SUPER_ADMIN with all permissions
          const DEV_CREDENTIALS: Record<string, UserRole> = {
            'chirag@gmail.com|123': 'SUPER_ADMIN',
            'admin@minesafe.com|admin': 'SITE_ADMIN',
            'admin@3rdvision.com|admin': 'SITE_ADMIN',
          };
          const key = `${email.trim().toLowerCase()}|${password}`;
          const matchedRole = DEV_CREDENTIALS[key];
          if (matchedRole) {
            const mockUser = {
              ...MOCK_USERS[matchedRole],
              email: email.trim().toLowerCase(),
              displayName: email === 'chirag@gmail.com' ? 'Chirag Rajput (Super Admin)' : MOCK_USERS[matchedRole].displayName,
              // Grant ALL permissions regardless of role
              permissions: ['*'],
              assignedSiteIds: MOCK_USERS['SUPER_ADMIN'].assignedSiteIds,
              role: matchedRole,
            };
            set({
              user: mockUser,
              firebaseToken: `dev-token-${matchedRole.toLowerCase()}-${Date.now()}`,
              isAuthenticated: true,
              selectedSiteId: 'site-kirandul-01',
              isLoading: false,
              authError: null,
            });
          } else {
            set({ isLoading: false, authError: 'Invalid email or password. Try chirag@gmail.com / 123' });
          }
        },

        loginAsDemoRole: (role: UserRole) => {
          const mockUser = MOCK_USERS[role];
          set({
            user: mockUser,
            firebaseToken: `demo-token-${role.toLowerCase()}`,
            isAuthenticated: true,
            selectedSiteId: mockUser.assignedSiteIds[0] || 'site-kirandul-01',
            isLoading: false,
            authError: null,
            demoSession: {
              demo: true,
              role,
              user: {
                id: `demo-${role.toLowerCase()}`,
                name: mockUser.displayName,
                email: mockUser.email || `${role.toLowerCase()}@3rdvision.local`,
              },
              siteId: 1,
            },
          });
        },

        switchDemoRole: (role: UserRole) => {
          get().loginAsDemoRole(role);
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await signOutFirebase();
          } catch (e) {
            console.error(e);
          }
          set({
            user: null,
            firebaseToken: null,
            isAuthenticated: false,
            isLoading: false,
            authError: null,
          });
        },

        setSelectedSiteId: (siteId: string) => set({ selectedSiteId: siteId }),
        clearAuthError: () => set({ authError: null }),

        // Simulation Actions
        setScenario: (scenario: SimulationScenario) => {
          simulationEngine.setScenario(scenario);
        },

        toggleSimulation: () => {
          simulationEngine.togglePlayPause();
        },

        setSimulationSpeed: (speedMs: number) => {
          simulationEngine.setSpeedMs(speedMs);
        },

        acknowledgeAlert: (alertId: string, acknowledgedBy: string) => {
          simulationEngine.acknowledgeAlert(alertId, acknowledgedBy);
        },

        resolveAlert: (alertId: string) => {
          simulationEngine.resolveAlert(alertId);
        },

        updateVehicleSpeed: (vehicleId: string, speedKmh: number) => {
          simulationEngine.updateVehicleSpeed(vehicleId, speedKmh);
        },

        restrictZone: (zoneId: string) => {
          simulationEngine.restrictZone(zoneId);
        },

        // UI Actions
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),

        syncWithSimulation: () => {
          const state = simulationEngine.getState();
          set({
            sites: state.sites,
            zones: state.zones,
            vehicles: state.vehicles,
            sensors: state.sensors,
            alerts: state.alerts,
            incidents: state.incidents,
            activeScenario: state.activeScenario,
            isPlaying: state.isPlaying,
            speedMs: state.speedMs,
          });
        },
      };
    },
    {
      name: 'minesafe-app-store',
      partialize: (state) => ({
        user: state.user,
        firebaseToken: state.firebaseToken,
        isAuthenticated: state.isAuthenticated,
        selectedSiteId: state.selectedSiteId,
      }),
    }
  )
);
