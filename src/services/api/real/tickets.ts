import { apiClient } from '../client';
import { ApiError, type PagedResult } from '@/types/api';
import type { DashboardCount, User } from '@/types/domain';
import {
  TicketPriority,
  TicketStatus,
  type AssignTicketPayload,
  type CreateTicketPayload,
  type ForwardTicketPayload,
  type RequestAssistancePayload,
  type RespondAssistancePayload,
  type TicketAttachment,
  type TicketDetail,
  type TicketListItem,
  type TimelineEvent,
  type TransferTicketPayload,
} from '@/types/ticket';
import type {
  ApiPriority,
  ApiStatus,
  AssignmentDto,
  AttachmentDto,
  CommentDto,
  CustomerDto,
  DepartmentPeriodDto,
  DepartmentQueueSummaryDto,
  EmployeeQueueSummaryDto,
  Envelope,
  Paged,
  TicketDto,
  TicketSummaryDto,
  TimelineEventDto,
} from './dto';
import {
  attachmentToDomain,
  priorityToApi,
  sourceToApi,
  statusToApiFilter,
  ticketSummaryToListItem,
  ticketToDetail,
  timelineToDomain,
  toPagedResult,
  visibilityToApi,
} from './mappers';
import type { TicketListParams } from '../ticketsApi';

const API = '/api';

async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return (await apiClient.get<T>(`${API}${url}`, { params })).data;
}
async function post<T = unknown>(url: string, body?: unknown): Promise<T> {
  return (await apiClient.post<T>(`${API}${url}`, body ?? {})).data;
}

/** Sub-resources a given role may not be allowed to read (e.g. customers and the assignment history) must not break the page. */
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export async function getTicketDetail(id: string): Promise<TicketDetail> {
  const [ticket, comments, attachments, timeline, assignments] = await Promise.all([
    get<Envelope<TicketDto>>(`/tickets/${id}`),
    safe(get<Paged<CommentDto>>(`/tickets/${id}/comments`, { pageSize: 100 }), { items: [] } as Paged<CommentDto>),
    safe(get<Envelope<AttachmentDto[]>>(`/tickets/${id}/attachments`), { data: [] } as Envelope<AttachmentDto[]>),
    safe(get<Envelope<TimelineEventDto[]>>(`/tickets/${id}/timeline`), { data: [] } as Envelope<TimelineEventDto[]>),
    safe(get<Envelope<AssignmentDto[]>>(`/tickets/${id}/assignments`), { data: [] } as Envelope<AssignmentDto[]>),
  ]);
  return ticketToDetail(ticket.data, {
    comments: comments.items,
    attachments: attachments.data,
    timeline: timeline.data,
    assignments: assignments.data,
  });
}

/** Runs a write, then returns the refreshed ticket so callers get the post-action state. */
async function mutate(id: string, write: () => Promise<unknown>): Promise<TicketDetail> {
  await write();
  return getTicketDetail(id);
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

const FETCH_ALL_PAGE_SIZE = 100;
const FETCH_ALL_MAX_PAGES = 5;

interface ClientFilter {
  search?: string;
  statuses?: TicketStatus[];
  excludeStatuses?: TicketStatus[];
  priorities?: TicketPriority[];
  unrouted?: boolean;
  overdueOnly?: boolean;
  criticalOnly?: boolean;
  escalatedOnly?: boolean;
}

function matches(t: TicketListItem, f: ClientFilter): boolean {
  if (f.search) {
    const s = f.search.toLowerCase();
    if (!`${t.number} ${t.subject} ${t.customerName}`.toLowerCase().includes(s)) return false;
  }
  if (f.statuses?.length && !f.statuses.includes(t.status)) return false;
  if (f.excludeStatuses?.includes(t.status)) return false;
  if (f.priorities?.length && !f.priorities.includes(t.priority)) return false;
  if (f.unrouted && t.currentDepartmentId) return false;
  if (f.overdueOnly && !t.isOverdue) return false;
  if (f.criticalOnly && t.priority !== TicketPriority.Critical) return false;
  if (f.escalatedOnly && !t.isEscalated) return false;
  return true;
}

interface Target {
  path: string;
  query: Record<string, unknown>;
  client: ClientFilter;
}

/** Picks the backend endpoint for a UI list request and splits filters into server-side and client-side ones. */
function resolveTarget(params: TicketListParams, user: User): Target {
  const departmentId = params.departmentId ?? user.departmentId;

  if ((params.scope === 'department-queue' || params.scope === 'department-unassigned') && departmentId) {
    const bucket = params.bucket ?? (params.scope === 'department-unassigned' ? 'unassigned' : 'all');
    return { path: `/queues/departments/${departmentId}`, query: { bucket }, client: queueClientFilter(params) };
  }
  if (params.scope === 'mine' || params.scope === 'team') {
    const bucket = params.bucket ?? (params.scope === 'team' ? 'team' : 'all');
    return { path: '/queues/me', query: { bucket }, client: queueClientFilter(params) };
  }

  // Generic search endpoint (already scoped to what the caller may see).
  const query: Record<string, unknown> = {};
  const client: ClientFilter = {};
  if (params.search) query.search = params.search;
  if (params.departmentId) query.departmentId = params.departmentId;
  if (params.overdueOnly) query.overdue = true;
  if (params.escalatedOnly) query.escalated = true;
  if (params.unassigned) query.unassigned = true;
  if (params.sortDir) query.order = params.sortDir;

  const priorities = params.criticalOnly ? [TicketPriority.Critical] : params.priorities;
  if (priorities?.length === 1) query.priority = priorityToApi(priorities[0]);
  else if (priorities?.length) client.priorities = priorities;
  if (params.sources?.length === 1) query.source = sourceToApi(params.sources[0]);

  if (params.statuses?.length) {
    const api = new Set(params.statuses.map(statusToApiFilter));
    if (api.size === 1 && !api.has(undefined)) query.status = [...api][0];
    else client.statuses = params.statuses;
  }
  if (params.excludeStatuses?.length) client.excludeStatuses = params.excludeStatuses;
  if (params.unrouted) client.unrouted = true;
  return { path: '/tickets', query, client };
}

/** Queue endpoints only take a bucket, so everything else is applied after fetching. Statuses are ignored when a bucket is chosen. */
function queueClientFilter(params: TicketListParams): ClientFilter {
  return {
    search: params.search,
    priorities: params.priorities,
    excludeStatuses: params.excludeStatuses,
    statuses: params.bucket ? undefined : params.statuses,
    overdueOnly: params.bucket ? undefined : params.overdueOnly,
    criticalOnly: params.bucket ? undefined : params.criticalOnly,
    escalatedOnly: params.escalatedOnly,
  };
}

const hasClientFilter = (f: ClientFilter) => Object.values(f).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));

export async function listTickets(params: TicketListParams, user: User): Promise<PagedResult<TicketListItem>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const { path, query, client } = resolveTarget(params, user);

  if (!hasClientFilter(client)) {
    const res = await get<Paged<TicketSummaryDto>>(path, { ...query, page, pageSize });
    return toPagedResult(res, (t) => ticketSummaryToListItem(t), { page, pageSize });
  }

  const all: TicketListItem[] = [];
  for (let p = 1; p <= FETCH_ALL_MAX_PAGES; p += 1) {
    const res = await get<Paged<TicketSummaryDto>>(path, { ...query, page: p, pageSize: FETCH_ALL_PAGE_SIZE });
    all.push(...(res.items ?? []).map((t) => ticketSummaryToListItem(t)));
    if (p >= (res.meta?.totalPages ?? 1)) break;
  }
  const filtered = all.filter((t) => matches(t, client));
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    totalCount: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

// ---------------------------------------------------------------------------
// Dashboard counters
// ---------------------------------------------------------------------------

async function countTickets(query: Record<string, unknown> = {}): Promise<number> {
  const res = await get<Paged<TicketSummaryDto>>('/tickets', { ...query, page: 1, pageSize: 1 });
  return res.meta?.total ?? res.items?.length ?? 0;
}

export async function customerCareCounts(): Promise<DashboardCount[]> {
  const [newCount, urgent, critical, overdue, unrouted] = await Promise.all([
    countTickets({ status: 'NEW' }),
    countTickets({ priority: 'URGENT' }),
    countTickets({ priority: 'CRITICAL' }),
    countTickets({ overdue: true }),
    // "Waiting to forward" = open tickets that no department owns yet; the API has no filter for it.
    listTickets({ unrouted: true, statuses: [TicketStatus.New], pageSize: 1 }, { departmentId: undefined } as User).then((r) => r.totalCount),
  ]);
  return [
    { key: 'new', label: 'New Tickets', count: newCount, tone: 'info' },
    { key: 'waiting-to-forward', label: 'Waiting to Forward', count: unrouted, tone: 'warning' },
    { key: 'urgent', label: 'Urgent', count: urgent, tone: 'warning' },
    { key: 'critical', label: 'Critical', count: critical, tone: 'critical' },
    { key: 'sla-at-risk', label: 'SLA At Risk', count: overdue, tone: 'danger' },
  ];
}

export async function managerCounts(departmentId: string): Promise<DashboardCount[]> {
  const { data } = await get<Envelope<DepartmentQueueSummaryDto>>(`/queues/departments/${departmentId}/summary`);
  const b = data.buckets ?? {};
  return [
    { key: 'incoming', label: 'Incoming', count: b.incoming ?? 0, tone: 'info' },
    { key: 'unassigned', label: 'Unassigned', count: b.unassigned ?? 0, tone: 'warning' },
    { key: 'assigned', label: 'Assigned', count: b.assigned ?? 0, tone: 'brand' },
    { key: 'in-progress', label: 'In Progress', count: b.inProgress ?? 0, tone: 'brand' },
    { key: 'waiting', label: 'Waiting', count: b.waiting ?? 0, tone: 'warning' },
    { key: 'overdue', label: 'Overdue', count: b.overdue ?? 0, tone: 'danger' },
    { key: 'critical', label: 'Critical', count: b.critical ?? 0, tone: 'critical' },
  ];
}

export async function employeeCounts(): Promise<DashboardCount[]> {
  const { data } = await get<Envelope<EmployeeQueueSummaryDto>>('/queues/me/summary');
  const b = data.buckets ?? {};
  return [
    { key: 'my-tickets', label: 'My Tickets', count: b.assigned ?? 0, tone: 'brand' },
    { key: 'team-tickets', label: 'Team Tickets', count: b.team ?? 0, tone: 'neutral' },
    { key: 'in-progress', label: 'In Progress', count: b.inProgress ?? 0, tone: 'brand' },
    { key: 'overdue', label: 'Overdue', count: b.overdue ?? 0, tone: 'danger' },
    { key: 'waiting', label: 'Waiting', count: b.waiting ?? 0, tone: 'warning' },
  ];
}

export async function customerCounts(): Promise<DashboardCount[]> {
  const [total, waiting, resolved, closed] = await Promise.all([
    countTickets(),
    countTickets({ status: 'WAITING' }),
    countTickets({ status: 'RESOLVED' }),
    countTickets({ status: 'CLOSED' }),
  ]);
  return [
    { key: 'open', label: 'Open', count: Math.max(0, total - resolved - closed), tone: 'brand' },
    { key: 'waiting-for-me', label: 'Waiting for Me', count: waiting, tone: 'warning' },
    { key: 'resolved', label: 'Resolved', count: resolved, tone: 'success' },
    { key: 'closed', label: 'Closed', count: closed, tone: 'neutral' },
  ];
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/** Tickets reference a customer record: reuse the one with this phone number, or create it. */
async function resolveCustomerId(payload: CreateTicketPayload, user: User): Promise<string> {
  if (user.customerId) return user.customerId;
  if (user.role === 'Customer') {
    throw new ApiError({ status: 400, message: 'Your account is not linked to a customer record. Please contact support.' });
  }
  const digits = (s: string) => s.replace(/\D/g, '');
  const found = await get<Paged<CustomerDto>>('/customers', { search: payload.customer.phone, pageSize: 20 });
  const existing = (found.items ?? []).find((c) => digits(c.primaryPhone ?? '') === digits(payload.customer.phone));
  if (existing) return existing.id;
  const created = await post<Envelope<CustomerDto>>('/customers', {
    fullName: payload.customer.name,
    primaryPhone: payload.customer.phone,
    email: payload.customer.email,
  });
  return created.data.id;
}

export async function createTicket(payload: CreateTicketPayload, user: User): Promise<TicketDetail> {
  const customerId = await resolveCustomerId(payload, user);
  // The API has no category fields, so keep what the user typed in the description rather than dropping it.
  const category = [payload.category, payload.subCategory].filter(Boolean).join(' / ');
  const description = category ? `Category: ${category}\n\n${payload.description}` : payload.description;
  const isCustomer = user.role === 'Customer';
  const requested = priorityToApi(payload.requestedPriority);

  const created = await post<Envelope<TicketDto>>('/tickets', {
    customerId,
    subject: payload.subject,
    description,
    source: sourceToApi(payload.source),
    customerRequestedPriority: requested,
    // Only staff set the working priority; customers can only request one.
    ...(isCustomer ? {} : { priority: requested }),
    contactPhone: payload.customer.phone || undefined,
    callReference: payload.callInfo?.callId,
    callStartedAt: payload.callInfo?.callStart,
    callEndedAt: payload.callInfo?.callEnd,
  });
  return getTicketDetail(created.data.id);
}

// ---------------------------------------------------------------------------
// Routing & assignment
// ---------------------------------------------------------------------------

export const forwardTicket = (id: string, p: ForwardTicketPayload) =>
  mutate(id, () => post(`/tickets/${id}/forward`, { departmentId: p.departmentId, reason: [p.reason, p.comment].filter(Boolean).join(' — ') || undefined }));

export const assignTicket = (id: string, p: AssignTicketPayload) =>
  mutate(id, () => post(`/tickets/${id}/assign`, { employeeIds: p.assignToEntireTeam ? undefined : p.employeeIds, assignToEntireTeam: p.assignToEntireTeam, comment: p.comment }));

export const addAssignee = (id: string, employeeId: string) => mutate(id, () => post(`/tickets/${id}/assignees`, { employeeIds: [employeeId] }));

export const removeAssignee = (id: string, employeeId: string) =>
  mutate(id, () => apiClient.delete(`${API}/tickets/${id}/assignees`, { data: { employeeIds: [employeeId] } }));

export const unassignTicket = (id: string, note?: string) =>
  mutate(id, () => post(`/tickets/${id}/unassign`, { reason: note || 'Returned to the department queue' }));

export const transferTicket = (id: string, p: TransferTicketPayload) =>
  mutate(id, () => post(`/tickets/${id}/transfer`, { departmentId: p.toDepartmentId, reason: p.reason }));

// ---------------------------------------------------------------------------
// Collaboration
// ---------------------------------------------------------------------------

export const requestAssistance = (id: string, p: RequestAssistancePayload) =>
  mutate(id, () => post(`/tickets/${id}/collaboration-requests`, { targetDepartmentId: p.targetDepartmentId, reason: p.reason }));

export const respondAssistance = (id: string, p: RespondAssistancePayload) =>
  mutate(id, async () => {
    const accept = p.accept !== false;
    await post(`/collaboration-requests/${p.requestId}/respond`, { accept, response: p.response });
    if (accept && p.markCompleted) await post(`/collaboration-requests/${p.requestId}/complete`, { response: p.response });
  });

export const cancelAssistance = (id: string, requestId: string, reason?: string) =>
  mutate(id, () => post(`/collaboration-requests/${requestId}/cancel`, { reason }));

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function changeStatus(id: string, status: TicketStatus, note?: string): Promise<TicketDetail> {
  switch (status) {
    case TicketStatus.Resolved:
      return mutate(id, () => post(`/tickets/${id}/resolve`, { resolutionNote: note || 'Resolved' }));
    case TicketStatus.Closed:
      return mutate(id, () => post(`/tickets/${id}/close`, { closureNote: note }));
    case TicketStatus.Reopened:
      return mutate(id, () => post(`/tickets/${id}/reopen`, { reason: note || 'Reopened' }));
    case TicketStatus.WaitingForCustomer:
      return mutate(id, () => post(`/tickets/${id}/status`, { status: 'WAITING', waitingReason: 'CUSTOMER', waitingNote: note }));
    case TicketStatus.WaitingForDepartment:
      return mutate(id, () => post(`/tickets/${id}/status`, { status: 'WAITING', waitingReason: 'ANOTHER_DEPARTMENT', waitingNote: note }));
    case TicketStatus.New:
    case TicketStatus.Assigned:
    case TicketStatus.InProgress: {
      const api: ApiStatus = status === TicketStatus.New ? 'NEW' : status === TicketStatus.Assigned ? 'ASSIGNED' : 'IN_PROGRESS';
      return mutate(id, () => post(`/tickets/${id}/status`, { status: api, reason: note }));
    }
    default:
      return Promise.reject(new ApiError({ status: 400, message: `The status "${status}" is not supported by the server.` }));
  }
}

export const changePriority = (id: string, priority: TicketPriority) =>
  mutate(id, () => post(`/tickets/${id}/priority`, { priority: priorityToApi(priority) satisfies ApiPriority }));

export const escalateTicket = (id: string, reason?: string) => mutate(id, () => post(`/tickets/${id}/escalate`, { reason: reason || 'Escalated' }));

export const addComment = (id: string, message: string, visibility: 'Customer' | 'Internal') =>
  mutate(id, () => post(`/tickets/${id}/comments`, { body: message, visibility: visibilityToApi(visibility) }));

export const notifyCustomer = (id: string, message: string) => mutate(id, () => post(`/tickets/${id}/notify-customer`, { body: message }));

export const confirmResolution = (id: string) => mutate(id, () => post(`/tickets/${id}/confirm-resolution`));

export const updateTicket = (id: string, patch: { subject?: string; description?: string; requestedPriority?: TicketPriority; contactPhone?: string }) =>
  mutate(id, async () => {
    await apiClient.patch(`${API}/tickets/${id}`, {
      subject: patch.subject,
      description: patch.description,
      customerRequestedPriority: patch.requestedPriority ? priorityToApi(patch.requestedPriority) : undefined,
      contactPhone: patch.contactPhone,
    });
  });

// ---------------------------------------------------------------------------
// History, timeline, attachments
// ---------------------------------------------------------------------------

export async function getTimeline(id: string): Promise<TimelineEvent[]> {
  const res = await get<Envelope<TimelineEventDto[]>>(`/tickets/${id}/timeline`);
  return res.data.map((e) => timelineToDomain(e, id));
}

export async function getDepartmentHistory(id: string): Promise<DepartmentPeriodDto[]> {
  return (await get<Envelope<DepartmentPeriodDto[]>>(`/tickets/${id}/history/departments`)).data;
}

export async function getStatusHistory(id: string): Promise<Record<string, unknown>[]> {
  return (await get<Envelope<Record<string, unknown>[]>>(`/tickets/${id}/history/status`)).data;
}

export async function getPriorityHistory(id: string): Promise<Record<string, unknown>[]> {
  return (await get<Envelope<Record<string, unknown>[]>>(`/tickets/${id}/history/priority`)).data;
}

export async function listAttachments(id: string): Promise<TicketAttachment[]> {
  const res = await get<Envelope<AttachmentDto[]>>(`/tickets/${id}/attachments`);
  return res.data.map((a) => attachmentToDomain(a, id));
}

export async function uploadAttachment(id: string, file: File, visibility: 'Customer' | 'Internal' = 'Customer'): Promise<TicketAttachment> {
  const form = new FormData();
  form.append('file', file);
  form.append('visibility', visibilityToApi(visibility));
  const res = await apiClient.post<Envelope<AttachmentDto>>(`${API}/tickets/${id}/attachments`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return attachmentToDomain(res.data.data, id);
}

/** Attachment downloads require the bearer token, so fetch the bytes and hand back a blob the caller can save. */
export async function downloadAttachment(ticketId: string, attachmentId: string): Promise<{ blob: Blob; fileName?: string }> {
  const res = await apiClient.get<Blob>(`${API}/tickets/${ticketId}/attachments/${attachmentId}`, { responseType: 'blob' });
  const disposition = String(res.headers['content-disposition'] ?? '');
  const fileName = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1];
  return { blob: res.data, fileName: fileName ? decodeURIComponent(fileName) : undefined };
}
