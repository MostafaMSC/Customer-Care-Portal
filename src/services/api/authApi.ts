import type { User } from '@/types/domain';
import { apiClient, toApiError } from './client';
import { isRealMode } from './mode';
import { delay } from '@/services/mock/helpers';
import { findUserByUsername, MOCK_PASSWORD } from '@/services/mock/seedOrg';
import { ApiError } from '@/types/api';

export interface LoginResult {
  user: User;
  accessToken: string;
}

/**
 * Real mode maps directly onto the existing backend contract:
 *   POST /api/auth/login  { Username, Password } -> AuthResponse (cookie set + accessToken)
 *   GET  /api/auth/me     -> UserDto
 * The backend's UserDto has no `permissions` field yet, so real-mode users get an
 * empty permission list until the backend exposes one - see
 * /docs/api/frontend-requirements.md ("Permissions on /api/auth/me").
 */
export const authApi = {
  async login(username: string, password: string): Promise<LoginResult> {
    if (!isRealMode) {
      await delay(undefined, 450);
      const user = findUserByUsername(username);
      if (!user || password !== MOCK_PASSWORD) {
        throw new ApiError({ status: 401, message: 'Invalid username or password.' });
      }
      return { user, accessToken: `mock-token-${user.id}` };
    }

    try {
      const { data } = await apiClient.post('/api/auth/login', { Username: username, Password: password });
      if (data.requires2FA) {
        throw new ApiError({ status: 401, message: 'Two-factor authentication is required but not yet supported by this app.' });
      }
      const backendUser = data.user;
      const user: User = {
        id: String(backendUser.id),
        name: backendUser.username,
        username: backendUser.username,
        email: backendUser.email,
        role: backendUser.role,
        permissions: [],
        departmentId: backendUser.departmentId ? String(backendUser.departmentId) : undefined,
        departmentName: backendUser.departmentName ?? undefined,
        avatarUrl: backendUser.photo ?? undefined,
      };
      return { user, accessToken: data.accessToken };
    } catch (error) {
      throw toApiError(error);
    }
  },

  async me(): Promise<User> {
    if (!isRealMode) throw new ApiError({ status: 501, message: 'me() is only used in real mode.' });
    const { data } = await apiClient.get('/api/auth/me');
    return {
      id: String(data.id),
      name: data.username,
      username: data.username,
      email: data.email,
      role: data.role,
      permissions: [],
      departmentId: data.departmentId ? String(data.departmentId) : undefined,
      departmentName: data.departmentName ?? undefined,
      avatarUrl: data.photo ?? undefined,
    };
  },

  async logout(): Promise<void> {
    if (isRealMode) {
      await apiClient.post('/api/auth/logout').catch(() => undefined);
    } else {
      await delay(undefined, 150);
    }
  },
};
