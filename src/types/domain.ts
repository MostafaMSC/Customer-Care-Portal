/**
 * Core organizational entities: roles, permissions, users, departments, customers.
 *
 * NOTE ON ROLES: the real backend (FingerPrint.Domain.Enums.UserType) only knows
 * User | Manager | Administrator | HR. The Customer Care / Customer / Management
 * distinctions below are part of the ticket-routing domain this app assumes -
 * see /docs/api/frontend-requirements.md for the mapping and the gap this creates.
 */

export const AppRole = {
  Customer: 'Customer',
  CustomerCare: 'CustomerCare',
  Employee: 'Employee',
  Manager: 'Manager',
  Management: 'Management',
  Administrator: 'Administrator',
} as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export const Permission = {
  TicketViewOwn: 'ticket.view.own',
  TicketViewDepartment: 'ticket.view.department',
  TicketViewAll: 'ticket.view.all',
  TicketCreate: 'ticket.create',
  TicketForward: 'ticket.forward',
  TicketAssign: 'ticket.assign',
  TicketAssignMultiple: 'ticket.assign.multiple',
  TicketAssignTeam: 'ticket.assign.team',
  TicketUnassign: 'ticket.unassign',
  TicketTransfer: 'ticket.transfer',
  TicketCollaborationRequest: 'ticket.collaboration.request',
  TicketCollaborationRespond: 'ticket.collaboration.respond',
  TicketChangePriority: 'ticket.changePriority',
  TicketChangeStatus: 'ticket.changeStatus',
  TicketAddInternalComment: 'ticket.addInternalComment',
  TicketAddCustomerResponse: 'ticket.addCustomerResponse',
  TicketResolve: 'ticket.resolve',
  TicketClose: 'ticket.close',
  TicketEscalate: 'ticket.escalate',
  ReportsView: 'reports.view',
  UsersManage: 'users.manage',
  DepartmentsManage: 'departments.manage',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId: string | null;
  managerName?: string;
  employeeCount: number;
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  jobTitle?: string;
  isManager?: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: AppRole;
  permissions: Permission[];
  departmentId?: string;
  departmentName?: string;
  jobTitle?: string;
  avatarUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  createdAt: string;
}

export interface DashboardCount {
  key: string;
  label: string;
  count: number;
  tone?: 'neutral' | 'info' | 'brand' | 'warning' | 'danger' | 'critical' | 'success';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  ticketId?: string;
  ticketNumber?: string;
  createdAt: string;
  readAt?: string | null;
}
