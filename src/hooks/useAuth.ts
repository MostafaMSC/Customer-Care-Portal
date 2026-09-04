import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/authApi';
import { ROLE_HOME } from '@/constants/nav';
import { notifyError } from '@/store/uiStore';
import { ApiError } from '@/types/api';

export function useAuth() {
  const { user, isAuthenticated, logout: clearAuth } = useAuthStore();
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => authApi.login(username, password),
    onSuccess: ({ user: loggedInUser, accessToken }) => {
      setAuth(loggedInUser, accessToken);
      navigate(ROLE_HOME[loggedInUser.role], { replace: true });
    },
    onError: (error) => {
      notifyError(error instanceof ApiError ? error.message : 'Unable to sign in.');
    },
  });

  function logout() {
    authApi.logout().finally(() => {
      clearAuth();
      navigate('/login', { replace: true });
    });
  }

  return { user, isAuthenticated, login: loginMutation.mutateAsync, isLoggingIn: loginMutation.isPending, logout };
}
