import { AppRole, Permission } from '@/types/domain';

/**
 * Mock-mode only: derives a user's permission set from their role so the mock
 * auth service can issue a realistic permission list. In real mode the backend
 * is the source of truth and must return permissions on GET /api/auth/me (see
 * /docs/api/frontend-requirements.md) - the frontend never invents authorization,
 * it only uses this list to decide what to *show*.
 */
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  [AppRole.Customer]: [Permission.TicketViewOwn, Permission.TicketCreate, Permission.TicketAddCustomerResponse],

  [AppRole.CustomerCare]: [
    Permission.TicketViewAll,
    Permission.TicketCreate,
    Permission.TicketForward,
    Permission.TicketChangePriority,
    Permission.TicketAddInternalComment,
  ],

  [AppRole.Employee]: [
    Permission.TicketViewOwn,
    Permission.TicketChangeStatus,
    Permission.TicketAddInternalComment,
    Permission.TicketAddCustomerResponse,
    Permission.TicketCollaborationRequest,
    Permission.TicketCollaborationRespond,
    Permission.TicketResolve,
  ],

  [AppRole.Manager]: [
    Permission.TicketViewDepartment,
    Permission.TicketAssign,
    Permission.TicketAssignMultiple,
    Permission.TicketAssignTeam,
    Permission.TicketUnassign,
    Permission.TicketTransfer,
    Permission.TicketCollaborationRequest,
    Permission.TicketCollaborationRespond,
    Permission.TicketChangePriority,
    Permission.TicketChangeStatus,
    Permission.TicketAddInternalComment,
    Permission.TicketAddCustomerResponse,
    Permission.TicketResolve,
    Permission.TicketClose,
    Permission.TicketEscalate,
  ],

  [AppRole.Management]: [
    Permission.TicketViewAll,
    Permission.ReportsView,
  ],

  [AppRole.Administrator]: Object.values(Permission),
};

export function hasPermission(userPermissions: Permission[] | undefined, permission: Permission): boolean {
  return !!userPermissions?.includes(permission);
}

export function hasAnyPermission(userPermissions: Permission[] | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(userPermissions, p));
}
