import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../store/appStore';
import { useSiteStore } from '../store/siteStore';
import { ROLES_CONFIG } from '../app/constants';
import { getDashboardPath } from '../utils/redirectByRole';
import {
  MapPin,
  Bell,
  LogOut,
  Menu,
} from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    setSelectedSiteId,
    connectionStatus,
    toggleNotifications,
    toggleSidebar,
    alerts,
  } = useAppStore();

  const { sites, selectedSite, setSelectedSite } = useSiteStore();

  const roleConfig = user ? ROLES_CONFIG[user.role] : null;
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  const handleSiteChange = (newSiteId: string) => {
    setSelectedSiteId(newSiteId);
    setSelectedSite(newSiteId);
  };

  // Determine system status
  const getStatusDisplay = () => {
    if (connectionStatus === 'LIVE') {
      return { label: 'LIVE', color: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50' };
    }
    if (connectionStatus === 'OFFLINE') {
      return { label: 'OFFLINE', color: 'bg-red-500', text: 'text-red-700', border: 'border-red-200', bg: 'bg-red-50' };
    }
    return { label: 'SIMULATION', color: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50' };
  };

  const status = getStatusDisplay();

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 bg-white px-2.5 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-2xs">
      {/* Brand & Site Selector */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={toggleSidebar}
          aria-label="Open Navigation Menu"
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => navigate(isAuthenticated && user ? getDashboardPath(user.role) : '/')}
          className="flex items-center cursor-pointer group select-none shrink-0"
        >
          <img
            src="/3rdvisionhorizontal.jpeg"
            alt="3rd Vision"
            width={854}
            height={192}
            decoding="async"
            fetchPriority="high"
            className="h-auto w-[140px] sm:w-[180px] object-contain object-left transition-transform group-hover:scale-[1.02]"
          />
        </div>

        <div className="h-5 w-px bg-slate-200 hidden md:block" />

        {/* Current Site Selector Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 transition-colors max-w-[130px] sm:max-w-none">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <select
            value={selectedSite.id}
            onChange={(e) => handleSiteChange(e.target.value)}
            aria-label="Select Mining Site"
            className="bg-transparent text-slate-800 text-xs font-semibold outline-none cursor-pointer truncate pr-0.5"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id} className="bg-white text-slate-800">
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Toolbar: System Status, Notifications, User */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* System Status Pill (LIVE, SIMULATION, OFFLINE) */}
        <div className={`flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border ${status.border} ${status.bg} text-[11px] sm:text-xs font-bold select-none`}>
          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${status.color} animate-pulse shrink-0`} />
          <span className={`${status.text} hidden xs:inline`}>{status.label}</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          onClick={toggleNotifications}
          aria-label="Open notifications feed"
          className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
          title="Safety Notifications"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* User Profile & Sign Out */}
        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200">
            <img
              src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
              alt={user.displayName}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 object-cover shrink-0"
            />
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 line-clamp-1">{user.displayName}</div>
              <div className="text-[10px] text-blue-700 font-semibold">{roleConfig?.label || 'User'}</div>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate('/', { replace: true });
              }}
              aria-label="Sign Out"
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
