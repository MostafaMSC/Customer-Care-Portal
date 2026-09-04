import {
  AssignmentType,
  CollaborationStatus,
  TicketPriority,
  TicketSource,
  TicketStatus,
  TimelineEventType,
  type AssignTicketPayload,
  type CreateTicketPayload,
  type ForwardTicketPayload,
  type RequestAssistancePayload,
  type RespondAssistancePayload,
  type TicketAssignment,
  type TicketDetail,
  type TicketListItem,
  type TransferTicketPayload,
} from '@/types/ticket';
import type { User } from '@/types/domain';
import { ApiError } from '@/types/api';
import { customers, departments, users } from './seedOrg';
import { seedTickets } from './seedTickets';
import { nextId } from './helpers';

/** Mock-only link from a Customer-role app user to their customer record. */
export const CUSTOMER_USER_LINK: Record<string, string> = { 'cust-user-mustafa': 'cust-1' };

let tickets: TicketDetail[] = structuredClone(seedTickets);
let ticketSeq = 200;

export function resetMockDb(): void {
  tickets = structuredClone(seedTickets);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function toListItem(t: TicketDetail): TicketListItem {
  const {
    comments: _c,
    attachments: _a,
    timeline: _tl,
    assignmentHistory: _ah,
    transferHistory: _th,
    collaborationRequests: _cr,
    description: _d,
    ...rest
  } = t;
  return rest;
}

function findOrThrow(ticketId: string): TicketDetail {
  const t = tickets.find((x) => x.id === ticketId);
  if (!t) throw new ApiError({ status: 404, message: `Ticket ${ticketId} was not found.` });
  return t;
}

function pushTimeline(
  t: TicketDetail,
  type: keyof typeof TimelineEventType,
  actorName: string,
  summary: string,
  detail?: string,
) {
  t.timeline.push({
    id: nextId('evt'),
    ticketId: t.id,
    type: TimelineEventType[type],
    occurredAt: new Date().toISOString(),
    actorName,
    summary,
    detail,
  });
  t.updatedAt = new Date().toISOString();
}

function requireUser(userId: string): User {
  const u = users.find((x) => x.id === userId);
  if (!u) throw new ApiError({ status: 401, message: 'Unknown user.' });
  return u;
}

function requireDepartment(departmentId: string) {
  const d = departments.find((x) => x.id === departmentId);
  if (!d) throw new ApiError({ status: 404, message: 'Department not found.' });
  return d;
}

function activeAssignedUserIds(t: TicketDetail): string[] {
  if (!t.currentAssignment?.isActive) return [];
  return t.currentAssignment.members.filter((m) => m.isActive).map((m) => m.userId);
}

export function isUserInvolvedInTicket(t: TicketDetail, user: User): 'individual' | 'team' | null {
  if (!t.currentAssignment?.isActive) return null;
  if (t.currentAssignment.assignmentType === AssignmentType.EntireDepartment) {
    return t.currentAssignment.departmentId === user.departmentId ? 'team' : null;
  }
  return activeAssignedUserIds(t).includes(user.id) ? 'individual' : null;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface TicketQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  statuses?: TicketStatus[];
  excludeStatuses?: TicketStatus[];
  priorities?: TicketPriority[];
  sources?: TicketSource[];
  departmentId?: string;
  customerId?: string;
  createdByUserId?: string;
  assignedUserId?: string;
  teamOnlyForDepartmentId?: string;
  unrouted?: boolean;
  unassigned?: boolean;
  overdueOnly?: boolean;
  criticalOnly?: boolean;
  escalatedOnly?: boolean;
  sortDir?: 'asc' | 'desc';
}

export function queryTickets(q: TicketQuery): TicketDetail[] {
  let result = [...tickets];

  if (q.search) {
    const s = q.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.number.toLowerCase().includes(s) ||
        t.subject.toLowerCase().includes(s) ||
        t.customer.name.toLowerCase().includes(s),
    );
  }
  if (q.statuses?.length) result = result.filter((t) => q.statuses!.includes(t.status));
  if (q.excludeStatuses?.length) result = result.filter((t) => !q.excludeStatuses!.includes(t.status));
  if (q.priorities?.length) result = result.filter((t) => q.priorities!.includes(t.priority));
  if (q.sources?.length) result = result.filter((t) => q.sources!.includes(t.source));
  if (q.departmentId) result = result.filter((t) => t.currentDepartmentId === q.departmentId);
  if (q.customerId) result = result.filter((t) => t.customer.id === q.customerId);
  if (q.createdByUserId) result = result.filter((t) => t.createdByUserId === q.createdByUserId);
  if (q.unrouted) result = result.filter((t) => !t.currentDepartmentId);
  if (q.unassigned) result = result.filter((t) => !!t.currentDepartmentId && !t.currentAssignment?.isActive);
  if (q.overdueOnly) result = result.filter((t) => t.isOverdue);
  if (q.criticalOnly)
    result = result.filter((t) => t.priority === TicketPriority.Critical || t.priority === TicketPriority.Urgent);
  if (q.escalatedOnly) result = result.filter((t) => t.isEscalated);
  if (q.assignedUserId) {
    const user = requireUser(q.assignedUserId);
    result = result.filter((t) => isUserInvolvedInTicket(t, user) !== null);
  }
  if (q.teamOnlyForDepartmentId) {
    result = result.filter(
      (t) =>
        t.currentAssignment?.isActive &&
        t.currentAssignment.assignmentType === AssignmentType.EntireDepartment &&
        t.currentAssignment.departmentId === q.teamOnlyForDepartmentId,
    );
  }

  result.sort((a, b) => (q.sortDir === 'asc' ? 1 : -1) * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()));
  return result;
}

export function getTicketDetail(ticketId: string): TicketDetail {
  return clone(findOrThrow(ticketId));
}

export function listTicketItems(q: TicketQuery): TicketListItem[] {
  return queryTickets(q).map(toListItem);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function createTicket(payload: CreateTicketPayload, actor: User): TicketDetail {
  ticketSeq += 1;
  const year = new Date().getFullYear();
  let customer = customers.find(
    (c) => c.phone === payload.customer.phone || (payload.customer.email && c.email === payload.customer.email),
  );
  if (!customer) {
    customer = { id: nextId('cust'), name: payload.customer.name, phone: payload.customer.phone, email: payload.customer.email, createdAt: new Date().toISOString() };
    customers.push(customer);
  }

  const isPortal = payload.source === TicketSource.CustomerPortal;
  const now = new Date().toISOString();
  const t: TicketDetail = {
    id: nextId('tkt'),
    number: `TKT-${year}-${String(ticketSeq).padStart(5, '0')}`,
    subject: payload.subject,
    description: payload.description,
    category: payload.category,
    subCategory: payload.subCategory,
    source: payload.source,
    callInfo: payload.callInfo,
    customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    customerName: customer.name,
    createdByUserId: actor.id,
    createdByUserName: actor.name,
    requestedPriority: payload.requestedPriority,
    priority: payload.requestedPriority,
    status: isPortal ? TicketStatus.New : TicketStatus.UnderReview,
    assignedNames: [],
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    closedAt: null,
    isOverdue: false,
    isEscalated: false,
    transfersCount: 0,
    escalationsCount: 0,
    currentAssignment: null,
    comments: [],
    attachments: [],
    timeline: [],
    assignmentHistory: [],
    transferHistory: [],
    collaborationRequests: [],
  };
  pushTimeline(t, 'Created', isPortal ? 'Customer' : actor.name, `Ticket created via ${isPortal ? 'Customer Portal' : 'Customer Care'}`);
  tickets.unshift(t);
  return clone(t);
}

export function forwardTicket(ticketId: string, payload: ForwardTicketPayload, actor: User): TicketDetail {
  const t = findOrThrow(ticketId);
  const dept = requireDepartment(payload.departmentId);
  if (t.currentDepartmentId) {
    throw new ApiError({ status: 409, message: 'This ticket has already been forwarded to a department.' });
  }
  t.currentDepartmentId = dept.id;
  t.currentDepartmentName = dept.name;
  t.status = TicketStatus.WaitingForDepartment;
  pushTimeline(t, 'Forwarded', actor.name, `Customer Care forwarded ticket to ${dept.name} Department`, payload.reason);
  const manager = users.find((u) => u.id === dept.managerId);
  pushTimeline(t, 'DepartmentReceived', manager?.name ?? `${dept.name} Manager`, `${dept.name} Manager received ticket`);
  return clone(t);
}

function assertManagerOf(actor: User, departmentId: string) {
  if (actor.role === 'Administrator') return;
  const dept = departments.find((d) => d.id === departmentId);
  if (!dept || dept.managerId !== actor.id) {
    throw new ApiError({ status: 403, message: 'Only the manager of this department can manage its tickets.' });
  }
}

export function assignTicket(ticketId: string, payload: AssignTicketPayload, actor: User): TicketDetail {
  const t = findOrThrow(ticketId);
  if (!t.currentDepartmentId) {
    throw new ApiError({ status: 409, message: 'Forward this ticket to a department before assigning it.' });
  }
  assertManagerOf(actor, t.currentDepartmentId);

  if (payload.assignToEntireTeam && payload.employeeIds.length > 0) {
    throw new ApiError({ status: 400, message: 'Choose either specific employees or the entire team, not both.' });
  }
  if (!payload.assignToEntireTeam && payload.employeeIds.length === 0) {
    throw new ApiError({ status: 400, message: 'Select at least one employee or assign the entire team.' });
  }

  const deptUsers = users.filter((u) => u.departmentId === t.currentDepartmentId);
  for (const id of payload.employeeIds) {
    if (!deptUsers.some((u) => u.id === id)) {
      throw new ApiError({ status: 403, message: 'Employees must belong to the ticket\'s current department.' });
    }
  }

  const wasUnassigned = !t.currentAssignment?.isActive;
  if (t.currentAssignment?.isActive) {
    t.currentAssignment.isActive = false;
    t.currentAssignment.unassignedAt = new Date().toISOString();
  }

  const dept = requireDepartment(t.currentDepartmentId);
  const now = new Date().toISOString();
  const assignment: TicketAssignment = {
    id: nextId('asg'),
    ticketId: t.id,
    departmentId: dept.id,
    departmentName: dept.name,
    assignedByUserId: actor.id,
    assignedByUserName: actor.name,
    assignmentType: payload.assignToEntireTeam
      ? AssignmentType.EntireDepartment
      : payload.employeeIds.length === 1
        ? AssignmentType.Individual
        : AssignmentType.MultipleEmployees,
    members: payload.assignToEntireTeam
      ? []
      : payload.employeeIds.map((id) => {
          const u = deptUsers.find((x) => x.id === id)!;
          return { id: nextId('mem'), userId: u.id, userName: u.name, addedAt: now, removedAt: null, isActive: true };
        }),
    assignedAt: now,
    unassignedAt: null,
    isActive: true,
    notes: payload.comment,
  };
  t.assignmentHistory.push(assignment);
  t.currentAssignment = assignment;
  t.assignedNames = assignment.members.map((m) => m.userName);
  t.assignmentType = assignment.assignmentType;
  t.status = TicketStatus.Assigned;

  const summary = payload.assignToEntireTeam
    ? `Assigned to the entire ${dept.name} team`
    : `Assigned to ${assignment.members.map((m) => m.userName).join(', ')}`;
  pushTimeline(t, wasUnassigned ? 'Assigned' : 'AssignmentChanged', actor.name, summary, payload.comment);
  return clone(t);
}

export function updateAssignmentMembers(
  ticketId: string,
  action: 'add' | 'remove',
  employeeId: string,
  actor: User,
): TicketDetail {
  const t = findOrThrow(ticketId);
  if (!t.currentDepartmentId) throw new ApiError({ status: 409, message: 'Ticket has no owning department.' });
  assertManagerOf(actor, t.currentDepartmentId);
  if (!t.currentAssignment?.isActive || t.currentAssignment.assignmentType === AssignmentType.EntireDepartment) {
    throw new ApiError({ status: 409, message: 'This ticket has no individual assignment to modify.' });
  }

  const employee = users.find((u) => u.id === employeeId && u.departmentId === t.currentDepartmentId);
  if (!employee) throw new ApiError({ status: 403, message: 'Employee must belong to the ticket\'s department.' });

  if (action === 'add') {
    if (t.currentAssignment.members.some((m) => m.userId === employeeId && m.isActive)) {
      throw new ApiError({ status: 409, message: `${employee.name} is already assigned.` });
    }
    t.currentAssignment.members.push({ id: nextId('mem'), userId: employee.id, userName: employee.name, addedAt: new Date().toISOString(), removedAt: null, isActive: true });
    pushTimeline(t, 'AssignmentChanged', actor.name, `Added ${employee.name} to the assignment`);
  } else {
    const member = t.currentAssignment.members.find((m) => m.userId === employeeId && m.isActive);
    if (!member) throw new ApiError({ status: 404, message: `${employee.name} is not currently assigned.` });
    member.isActive = false;
    member.removedAt = new Date().toISOString();
    pushTimeline(t, 'AssignmentChanged', actor.name, `Removed ${employee.name} from the assignment`);
  }

  const activeMembers = t.currentAssignment.members.filter((m) => m.isActive);
  t.currentAssignment.assignmentType = activeMembers.length <= 1 ? AssignmentType.Individual : AssignmentType.MultipleEmployees;
  t.assignmentType = t.currentAssignment.assignmentType;
  t.assignedNames = activeMembers.map((m) => m.userName);
  return clone(t);
}

export function unassignTicket(ticketId: string, actor: User, note?: string): TicketDetail {
  const t = findOrThrow(ticketId);
  if (!t.currentDepartmentId) throw new ApiError({ status: 409, message: 'Ticket has no owning department.' });
  assertManagerOf(actor, t.currentDepartmentId);
  if (t.currentAssignment?.isActive) {
    t.currentAssignment.isActive = false;
    t.currentAssignment.unassignedAt = new Date().toISOString();
  }
  t.assignedNames = [];
  t.assignmentType = undefined;
  t.status = TicketStatus.WaitingForDepartment;
  pushTimeline(t, 'Unassigned', actor.name, 'Ticket returned to the department queue', note);
  return clone(t);
}

export function transferTicket(ticketId: string, payload: TransferTicketPayload, actor: User): TicketDetail {
  const t = findOrThrow(ticketId);
  if (!t.currentDepartmentId) throw new ApiError({ status: 409, message: 'Ticket has no owning department yet.' });
  assertManagerOf(actor, t.currentDepartmentId);
  const from = requireDepartment(t.currentDepartmentId);
  const to = requireDepartment(payload.toDepartmentId);
  if (from.id === to.id) throw new ApiError({ status: 400, message: 'Choose a different department to transfer to.' });

  if (t.currentAssignment?.isActive) {
    t.currentAssignment.isActive = false;
    t.currentAssignment.unassignedAt = new Date().toISOString();
  }
  t.assignedNames = [];
  t.assignmentType = undefined;
  t.transferHistory.push({
    id: nextId('trf'),
    ticketId: t.id,
    fromDepartmentId: from.id,
    fromDepartmentName: from.name,
    toDepartmentId: to.id,
    toDepartmentName: to.name,
    transferredByUserId: actor.id,
    transferredByUserName: actor.name,
    reason: payload.reason,
    transferredAt: new Date().toISOString(),
  });
  t.transfersCount += 1;
  t.currentDepartmentId = to.id;
  t.currentDepartmentName = to.name;
  t.status = TicketStatus.WaitingForDepartment;

  pushTimeline(t, 'Transferred', actor.name, `Transferred from ${from.name} to ${to.name}`, payload.reason);
  const manager = users.find((u) => u.id === to.managerId);
  pushTimeline(t, 'DepartmentReceived', manager?.name ?? `${to.name} Manager`, `${to.name} Manager received ticket`);
  return clone(t);
}

export function requestAssistance(ticketId: string, payload: RequestAssistancePayload, actor: User): TicketDetail {
  const t = findOrThrow(ticketId);
  if (!t.currentDepartmentId) throw new ApiError({ status: 409, message: 'Ticket has no owning department.' });
  const requesting = requireDepartment(t.currentDepartmentId);
  const target = requireDepartment(payload.targetDepartmentId);
  if (requesting.id === target.id) throw new ApiError({ status: 400, message: 'Choose a different department to request assistance from.' });

  t.collaborationRequests.push({
    id: nextId('collab'),
    ticketId: t.id,
    requestingDepartmentId: requesting.id,
    requestingDepartmentName: requesting.name,
    targetDepartmentId: target.id,
    targetDepartmentName: target.name,
    requestedByUserId: actor.id,
    requestedByUserName: actor.name,
    requestedAt: new Date().toISOString(),
    reason: payload.reason,
    status: CollaborationStatus.Pending,
  });
  pushTimeline(t, 'CollaborationRequested', actor.name, `Requested assistance from ${target.name}`, payload.reason);
  return clone(t);
}

export function respondAssistance(ticketId: string, payload: RespondAssistancePayload, actor: User): TicketDetail {
  const t = findOrThrow(ticketId);
  const req = t.collaborationRequests.find((r) => r.id === payload.requestId);
  if (!req) throw new ApiError({ status: 404, message: 'Collaboration request not found.' });
  req.status = payload.markCompleted ? CollaborationStatus.Completed : CollaborationStatus.Responded;
  req.respondedAt = new Date().toISOString();
  req.response = payload.response;
  pushTimeline(t, 'CollaborationResponded', actor.name, `${req.targetDepartmentName} responded to the assistance request`, payload.response);
  return clone(t);
}

export function changeStatus(ticketId: string, status: TicketStatus, actor: User, note?: string): TicketDetail {
  const t = findOrThrow(ticketId);
  t.status = status;
  if (status === TicketStatus.Resolved) t.resolvedAt = new Date().toISOString();
  if (status === TicketStatus.Closed) t.closedAt = new Date().toISOString();
  const label = status === TicketStatus.Resolved ? 'Resolved' : status === TicketStatus.Closed ? 'Closed' : status === TicketStatus.Reopened ? 'Reopened' : 'StatusChanged';
  pushTimeline(t, label as keyof typeof TimelineEventType, actor.name, `Status changed to ${status}`, note);
  return clone(t);
}

export function changePriority(ticketId: string, priority: TicketPriority, actor: User): TicketDetail {
  const t = findOrThrow(ticketId);
  const from = t.priority;
  t.priority = priority;
  pushTimeline(t, 'PriorityChanged', actor.name, `Priority changed from ${from} to ${priority}`);
  return clone(t);
}

export function escalateTicket(ticketId: string, actor: User, reason?: string): TicketDetail {
  const t = findOrThrow(ticketId);
  t.isEscalated = true;
  t.escalationsCount += 1;
  pushTimeline(t, 'Escalated', actor.name, 'Ticket escalated', reason);
  return clone(t);
}

export function addComment(
  ticketId: string,
  message: string,
  visibility: 'Customer' | 'Internal',
  actor: User,
): TicketDetail {
  const t = findOrThrow(ticketId);
  t.comments.push({
    id: nextId('cmt'),
    ticketId: t.id,
    authorId: actor.id,
    authorName: actor.name,
    authorRole: actor.role,
    visibility,
    message,
    createdAt: new Date().toISOString(),
  });
  const label = visibility === 'Internal' ? 'InternalNoteAdded' : actor.role === 'Customer' ? 'CustomerResponded' : 'CommentAdded';
  pushTimeline(t, label, actor.name, visibility === 'Internal' ? 'Added an internal note' : 'Added a message');
  return clone(t);
}
