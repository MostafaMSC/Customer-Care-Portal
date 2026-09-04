import { useAuthStore } from '@/store/authStore';
import type { Permission } from '@/types/domain';
import { hasAnyPermission, hasPermission } from '@/constants/permissions';

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  return {
    can: (permission: Permission) => hasPermission(user?.permissions, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(user?.permissions, permissions),
  };
}
