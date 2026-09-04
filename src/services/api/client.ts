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
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        useAuthStore.getState().setAccessToken(data.accessToken);
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
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError({ status: 0, message: 'Network error. Please check your connection.' });
    }
    const body = error.response.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    return new ApiError({
      status: error.response.status,
      message: body?.message ?? defaultMessageFor(error.response.status),
      fieldErrors: body?.errors,
    });
  }
  return new ApiError({ status: 500, message: 'Unexpected error.' });
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
