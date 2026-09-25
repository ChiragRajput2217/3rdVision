import { useAppStore } from '../store/appStore';
import { UserRole } from '../types';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    selectedSiteId,
    authError,
    loginWithGoogle,
    loginAsDemoRole,
    logout,
    setSelectedSiteId,
    clearAuthError,
  } = useAppStore();

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  };

  return {
    user,
    role: user?.role,
    isAuthenticated,
    isLoading,
    selectedSiteId,
    authError,
    loginWithGoogle,
    loginAsDemoRole,
    logout,
    setSelectedSiteId,
    clearAuthError,
    hasRole,
    hasPermission,
  };
};
