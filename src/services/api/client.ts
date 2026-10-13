import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/types/api';

/**
 * Axios instance for the real backend. Mirrors the cookie-based refresh flow
 * already implemented in frontend/zktecofront/src/api/axios.ts so this app is
 * compatible with the existing FingerPrint auth cookies/session.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` } as typeof config.headers;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<() => void> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';

    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
        useAuthStore.getState().logout();
        if (!window.location.pathname.includes('/login')) window.location.href = '/login';
        return Promise.reject(toApiError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(apiClient(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token available');
        const { data: body } = await axios.post(`${apiClient.defaults.baseURL}/api/auth/refresh`, { refreshToken });
        // Backend envelope: { data: { accessToken, refreshToken, ... } }
        const session = (body?.data ?? body) as { accessToken: string; refreshToken?: string };
        useAuthStore.getState().setTokens(session.accessToken, session.refreshToken);
        queue.forEach((run) => run());
        queue = [];
        return apiClient(originalRequest);
      } catch (refreshError) {
        queue = [];
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(toApiError(refreshError as AxiosError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(toApiError(error));
  },
);

export function toApiError(error: AxiosError | unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError({ status: 0, message: 'Network error. Please check your connection.' });
    }
    // Backend error shape: { error: { code, message, details } }
    const body = error.response.data as
      | { message?: string; errors?: Record<string, string[]>; error?: { code?: string; message?: string; details?: unknown } }
      | undefined;
    return new ApiError({
      status: error.response.status,
      message: body?.error?.message ?? body?.message ?? defaultMessageFor(error.response.status),
      code: body?.error?.code,
      fieldErrors: body?.errors ?? fieldErrorsFromDetails(body?.error?.details),
    });
  }
  return new ApiError({ status: 500, message: 'Unexpected error.' });
}

/** Validation details arrive as [{ path|field, message }] (zod/class-validator style); anything else is ignored. */
function fieldErrorsFromDetails(details: unknown): Record<string, string[]> | undefined {
  if (!Array.isArray(details)) return undefined;
  const out: Record<string, string[]> = {};
  for (const d of details) {
    if (!d || typeof d !== 'object') continue;
    const item = d as { path?: unknown; field?: unknown; message?: unknown };
    const key = Array.isArray(item.path) ? item.path.join('.') : String(item.path ?? item.field ?? '');
    if (key && typeof item.message === 'string') (out[key] ??= []).push(item.message);
  }
  return Object.keys(out).length ? out : undefined;
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'The request could not be processed.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with the current state of the resource.';
    case 422:
      return 'Some fields need your attention.';
    case 429:
      return 'Too many requests. Please slow down and try again.';
    default:
      return status >= 500 ? 'Something went wrong on our end. Please try again.' : 'Request failed.';
  }
}
