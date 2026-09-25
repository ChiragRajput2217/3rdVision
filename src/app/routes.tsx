import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardPath } from '../utils/redirectByRole';
import type { UserRole } from '../types';

import { useAppStore } from '../store/appStore';

// Page imports
import { DemoLandingPage } from '../features/landing/pages/DemoLandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { Layout } from '../components/Layout';
import { SuperAdminDashboard } from '../features/super-admin/pages/SuperAdminDashboard';
import { SiteAdminDashboard } from '../features/site-admin/pages/SiteAdminDashboard';
import { SensorsPage } from '../features/site-admin/pages/SensorsPage';
import { VehiclesPage } from '../features/site-admin/pages/VehiclesPage';
import { AlertsPage } from '../features/site-admin/pages/AlertsPage';
import { ReportsPage } from '../features/site-admin/pages/ReportsPage';
import { SettingsPage } from '../features/site-admin/pages/SettingsPage';
import { ControlRoomDashboard } from '../features/control-room/pages/ControlRoomDashboard';
import { VehicleOperatorDashboard } from '../features/vehicle-operator/pages/VehicleOperatorDashboard';
import { ManagementDashboard } from '../features/management/pages/ManagementDashboard';
import { Analytics } from '../features/management/pages/Analytics';
import { RiskMap } from '../features/management/pages/RiskMap';
import { Reports } from '../features/management/pages/Reports';

// Stub page for unbuilt sub-routes — clean industrial configuration notice
const StubPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto my-8 font-sans">
    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-3xl">🏗</div>
    <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
    <p className="text-slate-500 text-sm max-w-md">
      This operational module is being configured for this mining sector.
    </p>
    <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold">
      Sector Configuration
    </span>
  </div>
);

// ProtectedRoute — allows direct access (bypasses login requirement)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// RoleRoute — allows universal access to any dashboard without role restriction redirects
const RoleRoute: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};


export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ─── PUBLIC AUTH & DEMO ROUTES ────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/demo" element={<DemoLandingPage />} />

      {/* Root route / leads to 3rd Vision Login Portal */}
      <Route path="/" element={<LoginPage />} />


      {/* ─── LAYOUT WRAPPER (Sidebar + Header) ─────────────────────── */}
      <Route element={<Layout />}>

        {/* ── UNIVERSAL CANONICAL ROUTES (accessible from sidebar or direct URL) ── */}
        <Route path="/dashboard" element={<SiteAdminDashboard />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/sensors" element={<SensorsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/map" element={<RiskMap />} />
        <Route path="/risk-map" element={<RiskMap />} />

        {/* ── PUBLIC / MANAGEMENT routes (no login required) ── */}
        <Route path="/public" element={<ManagementDashboard />} />
        <Route path="/public/analytics" element={<Analytics />} />
        <Route path="/public/alerts" element={<AlertsPage />} />
        <Route path="/public/incidents" element={<StubPage title="Public Incidents Log" />} />
        <Route path="/public/risk-map" element={<RiskMap />} />
        <Route path="/public/reports" element={<ReportsPage />} />
        {/* ── SUPER ADMIN routes ── */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                <Navigate to="/super-admin/dashboard" replace />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/super-admin/sites" element={<ProtectedRoute><RoleRoute allowedRoles={['SUPER_ADMIN']}><StubPage title="All Mining Sites" /></RoleRoute></ProtectedRoute>} />
        <Route path="/super-admin/users" element={<ProtectedRoute><RoleRoute allowedRoles={['SUPER_ADMIN']}><StubPage title="Platform Users" /></RoleRoute></ProtectedRoute>} />
        <Route path="/super-admin/devices" element={<ProtectedRoute><RoleRoute allowedRoles={['SUPER_ADMIN']}><SensorsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/super-admin/audit-logs" element={<ProtectedRoute><RoleRoute allowedRoles={['SUPER_ADMIN']}><StubPage title="Audit Logs" /></RoleRoute></ProtectedRoute>} />

        {/* ── SITE ADMIN routes ── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['SITE_ADMIN']}>
                <Navigate to="/admin/dashboard" replace />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><SiteAdminDashboard /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/vehicles" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><VehiclesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/sensors" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><SensorsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/devices" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><SensorsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><StubPage title="Site Users" /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/zones" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><StubPage title="Mining Zones" /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/alerts" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><AlertsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><ReportsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><RoleRoute allowedRoles={['SITE_ADMIN']}><SettingsPage /></RoleRoute></ProtectedRoute>} />

        {/* ── CONTROL ROOM routes ── */}
        <Route
          path="/control-room"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['CONTROL_ROOM_OPERATOR']}>
                <Navigate to="/control-room/dashboard" replace />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/control-room/dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={['CONTROL_ROOM_OPERATOR']}><ControlRoomDashboard /></RoleRoute></ProtectedRoute>} />
        <Route path="/control-room/map" element={<ProtectedRoute><RoleRoute allowedRoles={['CONTROL_ROOM_OPERATOR']}><RiskMap /></RoleRoute></ProtectedRoute>} />
        <Route path="/control-room/vehicles" element={<ProtectedRoute><RoleRoute allowedRoles={['CONTROL_ROOM_OPERATOR']}><VehiclesPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/control-room/alerts" element={<ProtectedRoute><RoleRoute allowedRoles={['CONTROL_ROOM_OPERATOR']}><AlertsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/control-room/reports" element={<ProtectedRoute><RoleRoute allowedRoles={['CONTROL_ROOM_OPERATOR']}><ReportsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/control-room/incidents" element={<ProtectedRoute><RoleRoute allowedRoles={['CONTROL_ROOM_OPERATOR']}><StubPage title="Incidents" /></RoleRoute></ProtectedRoute>} />
        <Route path="/control-room/risk-zones" element={<ProtectedRoute><RoleRoute allowedRoles={['CONTROL_ROOM_OPERATOR']}><StubPage title="Risk Zones" /></RoleRoute></ProtectedRoute>} />

        {/* ── VEHICLE OPERATOR routes ── */}
        <Route
          path="/operator"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['VEHICLE_OPERATOR']}>
                <Navigate to="/operator/dashboard" replace />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/operator/dashboard" element={<ProtectedRoute><RoleRoute allowedRoles={['VEHICLE_OPERATOR']}><VehicleOperatorDashboard /></RoleRoute></ProtectedRoute>} />
        <Route path="/operator/warnings" element={<ProtectedRoute><RoleRoute allowedRoles={['VEHICLE_OPERATOR']}><AlertsPage /></RoleRoute></ProtectedRoute>} />
        <Route path="/operator/trips" element={<ProtectedRoute><RoleRoute allowedRoles={['VEHICLE_OPERATOR']}><StubPage title="Trip History" /></RoleRoute></ProtectedRoute>} />

      </Route>

      {/* ─── CATCH-ALL ────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};


// Root redirect component — renders Demo Landing Page in DEMO_MODE, or redirects to /login in production
const RootRedirect: React.FC = () => {
  const { isDemoMode } = useAppStore();
  const { isAuthenticated, user } = useAuth();

  if (isDemoMode) {
    return <DemoLandingPage />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

