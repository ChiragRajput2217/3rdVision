import { UserRole } from '../types';

export const APP_NAME = '3rd Vision';
export const APP_SUBTITLE = 'Industrial Safety, IoT Monitoring & Predictive Risk Platform';

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  color: string;
  badgeBg: string;
  defaultRoute: string;
  indicator?: string;
}

export const ROLES_CONFIG: Record<UserRole, RoleConfig> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Platform-wide administration, tenant management & global health',
    color: 'text-purple-600',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    defaultRoute: '/super-admin/dashboard',
    indicator: 'bg-purple-500',
  },
  SITE_ADMIN: {
    role: 'SITE_ADMIN',
    label: 'Site Admin',
    description: 'Manage site vehicles, sensors, zones, users and alerts',
    color: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultRoute: '/admin/dashboard',
    indicator: 'bg-blue-500',
  },
  CONTROL_ROOM_OPERATOR: {
    role: 'CONTROL_ROOM_OPERATOR',
    label: 'Control Room Operator',
    description: 'Real-time safety monitoring, command center & live map intervention',
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    defaultRoute: '/control-room/dashboard',
    indicator: 'bg-indigo-500',
  },
  VEHICLE_OPERATOR: {
    role: 'VEHICLE_OPERATOR',
    label: 'Vehicle Operator',
    description: 'Simplified, high-contrast in-cab safety & speed compliance interface',
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    defaultRoute: '/operator/dashboard',
    indicator: 'bg-emerald-500',
  },
  MANAGEMENT: {
    role: 'MANAGEMENT',
    label: 'Management',
    description: 'Strategic safety analytics, fleet utilization & executive reporting',
    color: 'text-blue-600',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
    defaultRoute: '/public',
    indicator: 'bg-blue-500',
  },
};


export const SEVERITY_CONFIG: Record<string, {
  color: string;
  bg: string;
  border: string;
  badge: string;
  indicator: string;
}> = {
  NORMAL: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indicator: 'bg-emerald-500',
  },
  SAFE: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indicator: 'bg-emerald-500',
  },
  INFO: {
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    indicator: 'bg-blue-500',
  },
  WARNING: {
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    indicator: 'bg-amber-500',
  },
  HIGH: {
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    indicator: 'bg-rose-500',
  },
  HIGH_RISK: {
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    indicator: 'bg-rose-500',
  },
  CRITICAL: {
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-50 text-red-700 border-red-300 font-bold',
    indicator: 'bg-red-500',
  },
  OPERATIONAL: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indicator: 'bg-emerald-500',
  },
  MAINTENANCE: {
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    indicator: 'bg-slate-400',
  },
};
