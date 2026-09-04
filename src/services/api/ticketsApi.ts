import type { PagedResult } from '@/types/api';
import { ApiError } from '@/types/api';
import type {
  AssignTicketPayload,
  CreateTicketPayload,
  ForwardTicketPayload,
  RequestAssistancePayload,
  RespondAssistancePayload,
  TicketDetail,
  TicketListItem,
  TicketPriority,
  TicketStatus,
  TransferTicketPayload,
} from '@/types/ticket';
import type { DashboardCount } from '@/types/domain';
import { useAuthStore } from '@/store/authStore';
import { delay, paginate } from '@/services/mock/helpers';
import * as db from '@/services/mock/db';
import { departments, users } from '@/services/mock/seedOrg';

function currentUser() {
  const user = useAuthStore.getState().user;
  if (!user) throw new ApiError({ status: 401, message: 'Not authenticated.' });
  return user;
}

export interface TicketListParams extends Omit<db.TicketQuery, 'assignedUserId' | 'teamOnlyForDepartmentId' | 'customerId'> {
  scope?: 'all' | 'unrouted' | 'department-queue' | 'department-unassigned' | 'mine' | 'team' | 'customer';
}

function applyScope(params: TicketListParams): db.TicketQuery {
  const user = currentUser();
  const { scope, ...base } = params;
  switch (scope) {
    case 'unrouted':
      return { ...base, unrouted: true };
    case 'department-queue':
      return { ...base, departmentId: params.departmentId ?? user.departmentId };
    case 'department-unassigned':
      return { ...base, departmentId: params.departmentId ?? user.departmentId, unassigned: true };
    case 'mine':
      return { ...base, assignedUserId: user.id };
    case 'team':
      return { ...base, teamOnlyForDepartmentId: params.departmentId ?? user.departmentId };
    case 'customer':
      return { ...base, customerId: db.CUSTOMER_USER_LINK[user.id] };
    default:
      return base;
  }
}

export const ticketsApi = {
  async list(params: TicketListParams = {}): Promise<PagedResult<TicketListItem>> {
    const items = db.listTicketItems(applyScope(params));
    return delay(paginate(items, params.page, params.pageSize));
  },

  async get(id: string): Promise<TicketDetail> {
    const detail = db.getTicketDetail(id);
    return delay(currentUser().role === 'Customer' ? toCustomerSafeDetail(detail) : detail);
  },

  async create(payload: CreateTicketPayload): Promise<TicketDetail> {
    return delay(db.createTicket(payload, currentUser()), 500);
  },

  async forward(id: string, payload: ForwardTicketPayload): Promise<TicketDetail> {
    return delay(db.forwardTicket(id, payload, currentUser()), 450);
  },

  async assign(id: string, payload: AssignTicketPayload): Promise<TicketDetail> {
    return delay(db.assignTicket(id, payload, currentUser()), 450);
  },

  async addAssignmentMember(id: string, employeeId: string): Promise<TicketDetail> {
    return delay(db.updateAssignmentMembers(id, 'add', employeeId, currentUser()), 400);
  },

  async removeAssignmentMember(id: string, employeeId: string): Promise<TicketDetail> {
    return delay(db.updateAssignmentMembers(id, 'remove', employeeId, currentUser()), 400);
  },

  async unassign(id: string, note?: string): Promise<TicketDetail> {
    return delay(db.unassignTicket(id, currentUser(), note), 400);
  },

  async transfer(id: string, payload: TransferTicketPayload): Promise<TicketDetail> {
    return delay(db.transferTicket(id, payload, currentUser()), 450);
  },

  async requestAssistance(id: string, payload: RequestAssistancePayload): Promise<TicketDetail> {
    return delay(db.requestAssistance(id, payload, currentUser()), 400);
  },

  async respondAssistance(id: string, payload: RespondAssistancePayload): Promise<TicketDetail> {
    return delay(db.respondAssistance(id, payload, currentUser()), 400);
  },

  async changeStatus(id: string, status: TicketStatus, note?: string): Promise<TicketDetail> {
    return delay(db.changeStatus(id, status, currentUser(), note), 350);
  },

  async changePriority(id: string, priority: TicketPriority): Promise<TicketDetail> {
    return delay(db.changePriority(id, priority, currentUser()), 350);
  },

  async escalate(id: string, reason?: string): Promise<TicketDetail> {
    return delay(db.escalateTicket(id, currentUser(), reason), 350);
  },

  async addComment(id: string, message: string, visibility: 'Customer' | 'Internal'): Promise<TicketDetail> {
    return delay(db.addComment(id, message, visibility, currentUser()), 350);
  },

  async customerCareCounts(): Promise<DashboardCount[]> {
    const all = db.queryTickets({});
    const today = new Date().toDateString();
    const forwardedToday = all.filter((t) => t.timeline.some((e) => e.type === 'Forwarded' && new Date(e.occurredAt).toDateString() === today));
    return delay([
      { key: 'new', label: 'New Tickets', count: db.queryTickets({ statuses: ['New'] }).length, tone: 'info' },
      { key: 'review', label: 'Under Review', count: db.queryTickets({ statuses: ['UnderReview'] }).length, tone: 'neutral' },
      { key: 'waiting-to-forward', label: 'Waiting to Forward', count: db.queryTickets({ unrouted: true, excludeStatuses: ['New'] }).length, tone: 'warning' },
      { key: 'forwarded-today', label: 'Forwarded Today', count: forwardedToday.length, tone: 'brand' },
      { key: 'urgent', label: 'Urgent', count: db.queryTickets({ priorities: ['Urgent'] }).length, tone: 'warning' },
      { key: 'critical', label: 'Critical', count: db.queryTickets({ priorities: ['Critical'] }).length, tone: 'critical' },
      { key: 'sla-at-risk', label: 'SLA At Risk', count: db.queryTickets({ overdueOnly: true }).length, tone: 'danger' },
    ]);
  },

  async managerCounts(departmentId: string): Promise<DashboardCount[]> {
    const dept = { departmentId };
    return delay([
      { key: 'incoming', label: 'Incoming', count: db.queryTickets({ ...dept, statuses: ['WaitingForDepartment'] }).length, tone: 'info' },
      { key: 'unassigned', label: 'Unassigned', count: db.queryTickets({ ...dept, unassigned: true }).length, tone: 'warning' },
      { key: 'in-progress', label: 'In Progress', count: db.queryTickets({ ...dept, statuses: ['InProgress', 'Assigned'] }).length, tone: 'brand' },
      { key: 'waiting', label: 'Waiting', count: db.queryTickets({ ...dept, statuses: ['WaitingForCustomer', 'WaitingForDepartment'] }).length, tone: 'warning' },
      { key: 'overdue', label: 'Overdue', count: db.queryTickets({ ...dept, overdueOnly: true }).length, tone: 'danger' },
      { key: 'critical', label: 'Critical', count: db.queryTickets({ ...dept, criticalOnly: true }).length, tone: 'critical' },
    ]);
  },

  async employeeCounts(userId: string): Promise<DashboardCount[]> {
    const user = users.find((u) => u.id === userId)!;
    const mine = db.queryTickets({ assignedUserId: userId });
    const team = user.departmentId ? db.queryTickets({ teamOnlyForDepartmentId: user.departmentId }) : [];
    return delay([
      { key: 'my-tickets', label: 'My Tickets', count: mine.length, tone: 'brand' },
      { key: 'team-tickets', label: 'Team Tickets', count: team.length, tone: 'neutral' },
      { key: 'urgent', label: 'Urgent', count: mine.filter((t) => t.priority === 'Urgent' || t.priority === 'Critical').length, tone: 'critical' },
      { key: 'overdue', label: 'Overdue', count: mine.filter((t) => t.isOverdue).length, tone: 'danger' },
      { key: 'waiting', label: 'Waiting', count: mine.filter((t) => t.status === 'WaitingForCustomer' || t.status === 'WaitingForDepartment').length, tone: 'warning' },
    ]);
  },

  async customerCounts(): Promise<DashboardCount[]> {
    const customerId = db.CUSTOMER_USER_LINK[currentUser().id];
    const own = db.queryTickets({ customerId });
    return delay([
      { key: 'open', label: 'Open', count: own.filter((t) => !['Resolved', 'Closed', 'Cancelled'].includes(t.status)).length, tone: 'brand' },
      { key: 'waiting-for-me', label: 'Waiting for Me', count: own.filter((t) => t.status === 'WaitingForCustomer').length, tone: 'warning' },
      { key: 'resolved', label: 'Resolved', count: own.filter((t) => t.status === 'Resolved').length, tone: 'success' },
      { key: 'closed', label: 'Closed', count: own.filter((t) => t.status === 'Closed').length, tone: 'neutral' },
    ]);
  },
};

export function routableDepartments() {
  return departments.filter((d) => d.id !== 'dept-cc');
}

/**
 * Server-side view a Customer is allowed to see: no internal notes, no
 * assignment/transfer/collaboration mechanics, no operational timeline -
 * only the customer-visible conversation (spec section 23/10). In real mode
 * this filtering must happen on the backend, not just in the UI.
 */
function toCustomerSafeDetail(detail: TicketDetail): TicketDetail {
  return {
    ...detail,
    comments: detail.comments.filter((c) => c.visibility === 'Customer'),
    timeline: detail.timeline.filter((e) =>
      (['Created', 'StatusChanged', 'CustomerResponded', 'CommentAdded', 'Resolved', 'Closed', 'Reopened'] as string[]).includes(e.type),
    ),
    assignmentHistory: [],
    transferHistory: [],
    collaborationRequests: [],
    currentAssignment: null,
    assignedNames: [],
    assignmentType: undefined,
  };
}
