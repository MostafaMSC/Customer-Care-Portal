import type { User } from '@/types/domain';
import { apiClient, toApiError } from './client';
import { isRealMode } from './mode';
import { delay } from '@/services/mock/helpers';
import { findUserByEmail, MOCK_PASSWORD } from '@/services/mock/seedOrg';
import { ApiError } from '@/types/api';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponseDto, Envelope, ProfileDto } from './real/dto';
import { profileToUser } from './real/mappers';

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Real mode targets the Call Center System backend (docs/api/openapi.json):
 *   POST /api/auth/login            { email, password } -> { data: { accessToken, refreshToken, user } }
 *   POST /api/auth/refresh          { refreshToken }    -> { data: { accessToken, refreshToken } }  (see client.ts)
 *   GET  /api/auth/me               -> { data: Profile }
 *   POST /api/auth/logout           { refreshToken }
 *   POST /api/auth/change-password  { currentPassword, newPassword }
 * Permissions come from the backend profile; the frontend only uses them to decide what to show.
 */
export const authApi = {
  async login(email: string, password: string): Promise<LoginResult> {
    if (!isRealMode) {
      await delay(undefined, 450);
      const user = findUserByEmail(email);
      if (!user || password !== MOCK_PASSWORD) {
        throw new ApiError({ status: 401, message: 'Invalid email or password.' });
      }
      return { user, accessToken: `mock-token-${user.id}` };
    }

    try {
      const { data } = await apiClient.post<Envelope<AuthResponseDto>>('/api/auth/login', { email, password });
      const session = data.data;
      if (!session?.accessToken || !session.user) throw new Error('Login response was missing the session or user');
      return { user: profileToUser(session.user, email), accessToken: session.accessToken, refreshToken: session.refreshToken };
    } catch (error) {
      if (!(error instanceof ApiError) && !(error as { isAxiosError?: boolean }).isAxiosError) {
        console.error('[auth] failed to read login response', error);
      }
      throw toApiError(error);
    }
  },

  async me(): Promise<User> {
    if (!isRealMode) throw new ApiError({ status: 501, message: 'me() is only used in real mode.' });
    const { data } = await apiClient.get<Envelope<ProfileDto>>('/api/auth/me');
    return profileToUser(data.data);
  },

  async logout(): Promise<void> {
    if (isRealMode) {
      const refreshToken = useAuthStore.getState().refreshToken ?? undefined;
      await apiClient.post('/api/auth/logout', { refreshToken }).catch(() => undefined);
    } else {
      await delay(undefined, 150);
    }
  },

  /** Revokes every session on success, so the caller should sign the user out afterwards. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!isRealMode) {
      await delay(undefined, 300);
      return;
    }
    await apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
  },
};
