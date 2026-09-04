import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { AppRole } from '@/types/domain';

/**
 * Frontend role gating is for navigation/UX only - it hides screens a user
 * shouldn't need, it does not grant access. The backend must independently
 * reject any request the caller is not authorized for (spec section 40).
 */
export function RequireRole({ roles }: { roles: AppRole[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === AppRole.Administrator || roles.includes(user.role)) return <Outlet />;
  return <Navigate to="/403" replace />;
}
