import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/domain';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  /** Real backend only: exchanged at POST /auth/refresh when the access token expires. */
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string | null) => void;
  setAccessToken: (accessToken: string) => void;
  setTokens: (accessToken: string, refreshToken?: string | null) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken = null) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setTokens: (accessToken, refreshToken) => set((s) => ({ accessToken, refreshToken: refreshToken ?? s.refreshToken })),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'ccp-auth' },
  ),
);
