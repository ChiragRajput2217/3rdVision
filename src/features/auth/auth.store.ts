import { useAppStore } from '../../store/appStore';

// Re-export hook wrapper for backwards compatibility
export const useAuthStore = () => {
  const store = useAppStore();
  return {
    user: store.user,
    firebaseToken: store.firebaseToken,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    selectedSiteId: store.selectedSiteId,
    error: store.authError,
    loginWithGoogle: store.loginWithGoogle,
    loginWithEmail: store.loginWithEmail,
    loginAsDemoRole: store.loginAsDemoRole,
    logout: store.logout,
    setSelectedSiteId: store.setSelectedSiteId,
    clearError: store.clearAuthError,
  };
};
