import { UserRole } from '../types';

/**
 * Central role-based routing utility.
 * All components must use this function — never hardcode paths per role.
 */
export const getDashboardPath = (role: UserRole): string => {
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
    default:
      return '/public';
  }
};
