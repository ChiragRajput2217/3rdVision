import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/appStore';
import {
  LayoutDashboard,
  Truck,
  Radio,
  Map,
  Layers,
  ShieldAlert,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();

  const role = user?.role || 'SITE_ADMIN';

  // Automatically close mobile drawer when navigating
  useEffect(() => {
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  }, [location.pathname, sidebarOpen, toggleSidebar]);

  // Core 7 navigation links specified in requirements
  const getDashboardPath = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/super-admin/dashboard';
      case 'SITE_ADMIN':
        return '/admin/dashboard';
      case 'CONTROL_ROOM_OPERATOR':
        return '/control-room/dashboard';
      case 'VEHICLE_OPERATOR':
        return '/operator/dashboard';
      case 'MANAGEMENT':
        return '/public';
      default:
        return '/admin/dashboard';
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: getDashboardPath(),
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      activeMatch: (p: string) =>
        p.endsWith('/dashboard') || p === '/dashboard' || p === '/public' || p === '/super-admin' || p === '/admin',
    },
    {
      label: 'Vehicles',
      path: '/vehicles',
      icon: <Truck className="w-5 h-5 shrink-0" />,
      activeMatch: (p: string) => p.includes('/vehicles'),
    },
    {
      label: 'Sensors',
      path: '/sensors',
      icon: <Radio className="w-5 h-5 shrink-0" />,
      activeMatch: (p: string) => p.includes('/sensors') || p.includes('/devices'),
    },
    {
      label: 'Map',
      path: '/map',
      icon: <Map className="w-5 h-5 shrink-0" />,
      activeMatch: (p: string) => (p.includes('/map') || p.includes('/risk-map')),
    },
    {
      label: 'Alerts',
      path: '/alerts',
      icon: <ShieldAlert className="w-5 h-5 shrink-0" />,
      activeMatch: (p: string) => p.includes('/alerts') || p.includes('/warnings'),
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <FileText className="w-5 h-5 shrink-0" />,
      activeMatch: (p: string) => p.includes('/reports'),
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
      activeMatch: (p: string) => p.includes('/settings'),
    },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* ─── Mobile Backdrop Overlay ─── */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* ─── Mobile Slide-out Drawer (md:hidden) ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-3">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <img
                src="/3rdvisionlogo.jpeg"
                alt="3rd Vision"
                width={368}
                height={344}
                decoding="async"
                className="h-8 w-8 object-contain"
              />
              <span className="font-extrabold text-base tracking-tight text-slate-900">3rd Vision</span>
            </div>
            <button
              onClick={toggleSidebar}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1" aria-label="Mobile Navigation">
            {navItems.map((item) => {
              const isActive = item.activeMatch(location.pathname);
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600' : 'text-slate-500'}>{item.icon}</span>
                  <span className="truncate tracking-tight whitespace-nowrap font-medium text-sm">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-200 text-[11px] text-slate-400 text-center font-mono">
          DGMS Compliant Portal
        </div>
      </aside>

      {/* ─── Desktop Collapsible Sticky Sidebar (hidden md:flex) ─── */}
      <aside
        className={`${
          sidebarOpen ? 'w-[240px]' : 'w-[72px]'
        } bg-white border-r border-slate-200 hidden md:flex flex-col justify-between transition-all duration-300 ease-in-out z-20 sticky top-16 h-[calc(100vh-4rem)] select-none shrink-0 overflow-hidden shadow-2xs`}
      >
        <div className="p-3 space-y-2">
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = item.activeMatch(location.pathname);
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-blue-600' : 'text-slate-500'}>{item.icon}</span>
                  {sidebarOpen && (
                    <span className="truncate tracking-tight whitespace-nowrap font-medium text-sm">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Collapse / Expand Toggle Button */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold cursor-pointer"
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Menu</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
