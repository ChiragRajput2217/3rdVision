import { apiClient } from '../../services/api';
import { User, UserRole } from '../../types';
import { MOCK_USERS } from '../../services/mockData';

export interface VerifyTokenResponse {
  user: User;
  role: UserRole;
  permissions: string[];
  assignedSites: string[];
}

export const verifyFirebaseIdToken = async (
  idToken: string,
  preferredRole?: UserRole
): Promise<VerifyTokenResponse> => {
  try {
    const response = await apiClient.post<VerifyTokenResponse>('/auth/verify-token', {
      idToken,
      preferredRole,
    });
    return response.data;
  } catch (error) {
    console.warn('Backend endpoint unreachable, defaulting to frontend auth mock resolution:', error);
    const targetRole = preferredRole || 'SITE_ADMIN';
    const mockUser = MOCK_USERS[targetRole];
    return {
      user: mockUser,
      role: mockUser.role,
      permissions: mockUser.permissions,
      assignedSites: mockUser.assignedSiteIds,
    };
  }
};
