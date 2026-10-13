/**
 * Translates backend DTOs (./dto.ts) into the UI domain model (src/types).
 *
 * The backend has 6 ticket statuses; the UI has finer-grained ones. The two are
 * reconciled here (e.g. WAITING + waitingReason -> WaitingForCustomer /
 * WaitingForDepartment) rather than leaking backend vocabulary into components.
 */
import { AppRole, Permission, type Customer, type Department, type User } from '@/types/domain';
import type { PagedResult } from '@/types/api';
import {
  AssignmentType,
  CollaborationStatus,
  TicketPriority,
  TicketSource,
  TicketStatus,
  type CollaborationRequest,
  type DepartmentTransfer,
  type TicketAssignment,
  type TicketAttachment,
  type TicketComment,
  type TicketDetail,
  type TicketListItem,
  type TimelineEvent,
  type TimelineEventType,
} from '@/types/ticket';
import type {
  ApiAssignmentType,
  ApiCollaborationStatus,
  ApiPriority,
  ApiSource,
  ApiStatus,
  ApiVisibility,
  ApiWaitingReason,
  AssignmentDto,
  AttachmentDto,
  CollaborationRequestDto,
  CommentDto,
  CustomerDto,
  DepartmentDto,
  DepartmentPeriodDto,
  Paged,
  ProfileDto,
  TicketDto,
  TicketSummaryDto,
  TimelineEventDto,
  UserSummaryDto,
} from './dto';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

const ROLE_FROM_API: Record<string, AppRole> = {
  ADMIN: AppRole.Administrator,
  MANAGEMENT: AppRole.Management,
  CUSTOMER_CARE: AppRole.CustomerCare,
  DEPARTMENT_MANAGER: AppRole.Manager,
  EMPLOYEE: AppRole.Employee,
  CUSTOMER: AppRole.Customer,
};

export const ROLE_TO_API: Record<AppRole, string> = {
  [AppRole.Administrator]: 'ADMIN',
  [AppRole.Management]: 'MANAGEMENT',
  [AppRole.CustomerCare]: 'CUSTOMER_CARE',
  [AppRole.Manager]: 'DEPARTMENT_MANAGER',
  [AppRole.Employee]: 'EMPLOYEE',
  [AppRole.Customer]: 'CUSTOMER',
};

export function roleFromApi(value: unknown): AppRole {
  const role = ROLE_FROM_API[String(value ?? '').toUpperCase()];
  if (!role) throw new Error(`Unrecognised role from backend: ${JSON.stringify(value)}`);
  return role;
}

const PRIORITY_FROM_API: Record<ApiPriority, TicketPriority> = {
  LOW: TicketPriority.Low,
  NORMAL: TicketPriority.Normal,
  HIGH: TicketPriority.High,
  URGENT: TicketPriority.Urgent,
  CRITICAL: TicketPriority.Critical,
};
export const priorityFromApi = (p?: ApiPriority | null): TicketPriority => PRIORITY_FROM_API[p ?? 'NORMAL'] ?? TicketPriority.Normal;
export const priorityToApi = (p: TicketPriority): ApiPriority => p.toUpperCase() as ApiPriority;

const SOURCE_FROM_API: Record<ApiSource, TicketSource> = {
  PHONE_CALL: TicketSource.PhoneCall,
  EMAIL: TicketSource.Email,
  WEB: TicketSource.CustomerPortal,
  CHAT: TicketSource.Chat,
  WALK_IN: TicketSource.WalkIn,
  MOBILE_APP: TicketSource.MobileApp,
  INTERNAL: TicketSource.CustomerCare,
};
export const sourceFromApi = (s?: ApiSource | null): TicketSource => SOURCE_FROM_API[s ?? 'INTERNAL'] ?? TicketSource.CustomerCare;

const SOURCE_TO_API: Record<TicketSource, ApiSource> = {
  [TicketSource.PhoneCall]: 'PHONE_CALL',
  [TicketSource.Pbx]: 'PHONE_CALL',
  [TicketSource.Email]: 'EMAIL',
  [TicketSource.CustomerPortal]: 'WEB',
  [TicketSource.Chat]: 'CHAT',
  [TicketSource.WalkIn]: 'WALK_IN',
  [TicketSource.MobileApp]: 'MOBILE_APP',
  [TicketSource.CustomerCare]: 'INTERNAL',
  [TicketSource.Api]: 'INTERNAL',
};
export const sourceToApi = (s: TicketSource): ApiSource => SOURCE_TO_API[s];

/** `waitingReason` is only present on the full ticket, not on list rows, so list rows default to WaitingForCustomer. */
export function statusFromApi(status?: ApiStatus | null, waitingReason?: ApiWaitingReason | null): TicketStatus {
  switch (status) {
    case 'ASSIGNED':
      return TicketStatus.Assigned;
    case 'IN_PROGRESS':
      return TicketStatus.InProgress;
    case 'WAITING':
      return waitingReason && waitingReason !== 'CUSTOMER' ? TicketStatus.WaitingForDepartment : TicketStatus.WaitingForCustomer;
    case 'RESOLVED':
      return TicketStatus.Resolved;
    case 'CLOSED':
      return TicketStatus.Closed;
    default:
      return TicketStatus.New;
  }
}

/** Backend list filter for a UI status, or undefined when the UI status has no server-side equivalent. */
export function statusToApiFilter(status: TicketStatus): ApiStatus | undefined {
  switch (status) {
    case TicketStatus.New:
    case TicketStatus.Received:
    case TicketStatus.UnderReview:
      return 'NEW';
    case TicketStatus.Assigned:
      return 'ASSIGNED';
    case TicketStatus.InProgress:
      return 'IN_PROGRESS';
    case TicketStatus.WaitingForCustomer:
    case TicketStatus.WaitingForDepartment:
      return 'WAITING';
    case TicketStatus.Resolved:
      return 'RESOLVED';
    case TicketStatus.Closed:
      return 'CLOSED';
    default:
      return undefined;
  }
}

const ASSIGNMENT_TYPE_FROM_API: Record<ApiAssignmentType, AssignmentType> = {
  INDIVIDUAL: AssignmentType.Individual,
  MULTIPLE_EMPLOYEES: AssignmentType.MultipleEmployees,
  ENTIRE_DEPARTMENT: AssignmentType.EntireDepartment,
};
const assignmentTypeFromApi = (t?: ApiAssignmentType | null): AssignmentType | undefined => (t ? ASSIGNMENT_TYPE_FROM_API[t] : undefined);

const COLLAB_STATUS_FROM_API: Record<ApiCollaborationStatus, CollaborationStatus> = {
  PENDING: CollaborationStatus.Pending,
  ACCEPTED: CollaborationStatus.Responded,
  REJECTED: CollaborationStatus.Declined,
  COMPLETED: CollaborationStatus.Completed,
  CANCELLED: CollaborationStatus.Cancelled,
};

export const visibilityFromApi = (v?: ApiVisibility | null): 'Customer' | 'Internal' => (v === 'INTERNAL' ? 'Internal' : 'Customer');
export const visibilityToApi = (v: 'Customer' | 'Internal'): ApiVisibility => (v === 'Internal' ? 'INTERNAL' : 'PUBLIC');

// ---------------------------------------------------------------------------
// Auth / users
// ---------------------------------------------------------------------------

/** Backend permission names that differ from the frontend's constants. */
const PERMISSION_ALIASES: Record<string, Permission> = {
  'report.view': Permission.ReportsView,
  'user.manage': Permission.UsersManage,
  'department.manage': Permission.DepartmentsManage,
  'ticket.addComment': Permission.TicketAddCustomerResponse,
};
const KNOWN_PERMISSIONS = new Set<string>(Object.values(Permission));

export function permissionsFromApi(value: unknown): Permission[] {
  if (!Array.isArray(value)) return [];
  const mapped = value.map((p) => PERMISSION_ALIASES[String(p)] ?? String(p));
  return [...new Set(mapped)].filter((p): p is Permission => KNOWN_PERMISSIONS.has(p));
}

/**
 * `departmentId` drives UI scoping (manager queues, assignable team, etc.): managers use the
 * department they manage, everyone else their primary (or first) department.
 */
export function profileToUser(profile: ProfileDto, fallbackEmail = ''): User {
  const email = profile.email ?? fallbackEmail;
  const departments = profile.departments ?? [];
  const managedId = profile.managedDepartmentIds?.[0];
  const primary = profile.primaryDepartment ?? departments[0] ?? null;
  const home = managedId ? (departments.find((d) => d.id === managedId) ?? { id: managedId, name: undefined }) : primary;
  return {
    id: profile.id,
    name: profile.fullName ?? email,
    username: email,
    email,
    role: roleFromApi(profile.role),
    permissions: permissionsFromApi(profile.permissions),
    departmentId: home?.id,
    departmentName: home?.name,
    departmentIds: departments.map((d) => d.id),
    customerId: profile.customerId ?? undefined,
    jobTitle: profile.jobTitle ?? undefined,
  };
}

/** List/detail rows for admin screens. Permissions are not part of UserSummary. */
export function userSummaryToUser(u: UserSummaryDto): User {
  const role = ROLE_FROM_API[String(u.role ?? '').toUpperCase()] ?? AppRole.Employee;
  return {
    id: u.id,
    name: u.fullName ?? u.email ?? u.id,
    username: u.email ?? u.id,
    email: u.email ?? '',
    role,
    permissions: [],
    departmentId: u.primaryDepartmentId ?? undefined,
    customerId: u.customerId ?? undefined,
    jobTitle: u.jobTitle ?? undefined,
  };
}

export const userName = (u?: UserSummaryDto | null): string => u?.fullName ?? u?.email ?? 'System';

// ---------------------------------------------------------------------------
// Customers / departments
// ---------------------------------------------------------------------------

export function customerToDomain(c: CustomerDto): Customer {
  return {
    id: c.id,
    name: c.fullName ?? c.code ?? c.id,
    phone: c.primaryPhone ?? '',
    email: c.email ?? undefined,
    company: c.companyName ?? undefined,
    createdAt: c.createdAt ?? new Date(0).toISOString(),
  };
}

export function departmentToDomain(d: DepartmentDto): Department {
  const manager = d.managers?.[0];
  return {
    id: d.id,
    name: d.name ?? d.code ?? d.id,
    description: d.description ?? undefined,
    managerId: manager?.id ?? null,
    managerName: manager ? userName(manager) : undefined,
    employeeCount: d.memberCount ?? d.members?.length ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------

const iso = (v?: string | null): string => v ?? new Date(0).toISOString();

export function ticketSummaryToListItem(t: TicketSummaryDto, waitingReason?: ApiWaitingReason | null): TicketListItem {
  return {
    id: t.id,
    number: t.number ?? t.id,
    subject: t.subject ?? '',
    customerName: t.customer?.fullName ?? '—',
    source: sourceFromApi(t.source),
    priority: priorityFromApi(t.priority),
    status: statusFromApi(t.status, waitingReason),
    currentDepartmentId: t.currentDepartment?.id,
    currentDepartmentName: t.currentDepartment?.name,
    assignmentType: assignmentTypeFromApi(t.assignmentType),
    assignedNames: (t.participants ?? []).map(userName),
    createdAt: iso(t.createdAt),
    updatedAt: iso(t.updatedAt ?? t.createdAt),
    isOverdue: !!t.isOverdue,
    isEscalated: !!t.isEscalated,
  };
}

export function assignmentToDomain(a: AssignmentDto, ticketId: string): TicketAssignment {
  const members = (a.members ?? []).map((m) => ({
    id: m.id,
    userId: m.user?.id ?? '',
    userName: userName(m.user),
    addedAt: iso(m.addedAt),
    removedAt: m.removedAt ?? null,
    isActive: m.isActive ?? !m.removedAt,
  }));
  // An individual assignment may carry the employee only in `assignedTo`.
  if (members.length === 0 && a.assignedTo) {
    members.push({ id: `${a.id}-assignee`, userId: a.assignedTo.id, userName: userName(a.assignedTo), addedAt: iso(a.assignedAt), removedAt: null, isActive: a.isActive ?? true });
  }
  return {
    id: a.id,
    ticketId: a.ticketId ?? ticketId,
    departmentId: a.department?.id ?? '',
    departmentName: a.department?.name ?? '',
    assignedByUserId: a.assignedBy?.id ?? '',
    assignedByUserName: userName(a.assignedBy),
    assignmentType: assignmentTypeFromApi(a.assignmentType) ?? AssignmentType.Individual,
    members,
    assignedAt: iso(a.assignedAt),
    unassignedAt: a.unassignedAt ?? null,
    isActive: a.isActive ?? !a.unassignedAt,
    notes: a.notes ?? undefined,
  };
}

export function collaborationToDomain(c: CollaborationRequestDto, ticketId: string): CollaborationRequest {
  return {
    id: c.id,
    ticketId,
    requestingDepartmentId: c.requestingDepartment?.id ?? '',
    requestingDepartmentName: c.requestingDepartment?.name ?? '',
    targetDepartmentId: c.targetDepartment?.id ?? '',
    targetDepartmentName: c.targetDepartment?.name ?? '',
    requestedByUserId: c.requestedBy?.id ?? '',
    requestedByUserName: userName(c.requestedBy),
    requestedAt: iso(c.requestedAt),
    reason: c.reason ?? '',
    status: COLLAB_STATUS_FROM_API[c.status ?? 'PENDING'],
    respondedAt: c.respondedAt ?? null,
    response: c.response ?? undefined,
  };
}

/** Transfers are the TRANSFERRED entries of the department ownership history. */
export function transfersFromHistory(history: DepartmentPeriodDto[] | undefined, ticketId: string): DepartmentTransfer[] {
  return (history ?? [])
    .filter((p) => p.action === 'TRANSFERRED')
    .map((p) => ({
      id: p.id,
      ticketId,
      fromDepartmentId: p.previousDepartment?.id ?? '',
      fromDepartmentName: p.previousDepartment?.name ?? '',
      toDepartmentId: p.department?.id ?? '',
      toDepartmentName: p.department?.name ?? '',
      transferredByUserId: p.startedBy?.id ?? '',
      transferredByUserName: userName(p.startedBy),
      reason: p.reason ?? '',
      transferredAt: iso(p.startedAt),
    }));
}

export function commentToDomain(c: CommentDto, ticketId: string): TicketComment {
  return {
    id: c.id,
    ticketId: c.ticketId ?? ticketId,
    authorId: c.author?.id ?? '',
    authorName: userName(c.author),
    authorRole: c.author?.role ? (ROLE_FROM_API[c.author.role] ?? c.author.role) : '',
    visibility: visibilityFromApi(c.visibility),
    message: c.body ?? '',
    createdAt: iso(c.createdAt),
  };
}

export function attachmentToDomain(a: AttachmentDto, ticketId: string): TicketAttachment {
  return {
    id: a.id,
    ticketId: a.ticketId ?? ticketId,
    fileName: a.originalName ?? 'attachment',
    // Downloads need the bearer token, so the URL is resolved through ticketsApi.downloadAttachment.
    url: `/api/tickets/${a.ticketId ?? ticketId}/attachments/${a.id}`,
    uploadedByUserId: a.uploadedBy?.id ?? '',
    uploadedByName: userName(a.uploadedBy),
    uploadedAt: iso(a.createdAt),
    sizeBytes: a.sizeBytes ?? 0,
  };
}

/** Backend timeline `type` values are free-form strings; match on keywords, fall back to the raw value. */
export function timelineTypeFromApi(raw: string | undefined, visibility?: ApiVisibility): TimelineEventType {
  const t = String(raw ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  const has = (...words: string[]) => words.some((w) => t.includes(w));
  if (has('COLLABORATION', 'ASSISTANCE')) return has('REQUEST') ? 'CollaborationRequested' : 'CollaborationResponded';
  if (has('UNASSIGN')) return 'Unassigned';
  if (has('ASSIGN')) return has('CHANGE', 'ADDED', 'REMOVED') ? 'AssignmentChanged' : 'Assigned';
  if (has('TRANSFER')) return 'Transferred';
  if (has('FORWARD')) return 'Forwarded';
  if (has('REOPEN')) return 'Reopened';
  if (has('ESCALAT')) return 'Escalated';
  if (has('RESOLVE')) return 'Resolved';
  if (has('CLOSE')) return 'Closed';
  if (has('PRIORITY')) return 'PriorityChanged';
  if (has('STATUS')) return 'StatusChanged';
  if (has('NOTE') || (has('COMMENT') && visibility === 'INTERNAL')) return 'InternalNoteAdded';
  if (has('COMMENT')) return 'CommentAdded';
  if (has('CREATE')) return 'Created';
  return raw as TimelineEventType;
}

export function timelineToDomain(e: TimelineEventDto, ticketId: string): TimelineEvent {
  return {
    id: e.id,
    ticketId,
    type: timelineTypeFromApi(e.type, e.visibility),
    occurredAt: iso(e.createdAt),
    actorName: userName(e.actor),
    summary: e.message ?? e.type ?? '',
  };
}

export interface TicketExtras {
  comments?: CommentDto[];
  attachments?: AttachmentDto[];
  timeline?: TimelineEventDto[];
  assignments?: AssignmentDto[];
}

export function ticketToDetail(t: TicketDto, extras: TicketExtras = {}): TicketDetail {
  const base = ticketSummaryToListItem(t, t.waitingReason);
  const customer = t.customer;
  const hasCall = !!(t.call?.reference || t.call?.startedAt);
  return {
    ...base,
    assignedNames: (t.participants ?? []).map(userName),
    assignmentType: assignmentTypeFromApi(t.currentAssignment?.assignmentType ?? t.assignmentType),
    description: t.description ?? '',
    requestedPriority: priorityFromApi(t.customerRequestedPriority ?? t.priority),
    callInfo: hasCall
      ? {
          callId: t.call?.reference ?? '',
          callerNumber: t.call?.contactPhone ?? customer?.primaryPhone ?? '',
          callStart: iso(t.call?.startedAt),
          callEnd: t.call?.endedAt ?? undefined,
          agentName: userName(t.createdBy),
        }
      : undefined,
    customer: {
      id: customer?.id ?? '',
      name: customer?.fullName ?? '—',
      phone: customer?.primaryPhone ?? '',
      email: customer?.email ?? undefined,
    },
    createdByUserId: t.createdBy?.id ?? '',
    createdByUserName: userName(t.createdBy),
    slaResolutionDueAt: t.dueAt ?? undefined,
    resolvedAt: t.resolvedAt ?? null,
    closedAt: t.closedAt ?? null,
    transfersCount: t.transferCount ?? 0,
    escalationsCount: t.escalationCount ?? 0,
    currentAssignment: t.currentAssignment ? assignmentToDomain(t.currentAssignment, t.id) : null,
    comments: (extras.comments ?? []).map((c) => commentToDomain(c, t.id)),
    attachments: (extras.attachments ?? []).map((a) => attachmentToDomain(a, t.id)),
    timeline: (extras.timeline ?? []).map((e) => timelineToDomain(e, t.id)),
    assignmentHistory: (extras.assignments ?? []).map((a) => assignmentToDomain(a, t.id)),
    transferHistory: transfersFromHistory(t.departmentHistory, t.id),
    collaborationRequests: (t.collaborationRequests ?? []).map((c) => collaborationToDomain(c, t.id)),
  };
}

// ---------------------------------------------------------------------------
// Paging
// ---------------------------------------------------------------------------

export function toPagedResult<TIn, TOut>(res: Paged<TIn>, map: (item: TIn) => TOut, fallback: { page: number; pageSize: number }): PagedResult<TOut> {
  const items = (res.items ?? []).map(map);
  const pageSize = res.meta?.pageSize ?? fallback.pageSize;
  const totalCount = res.meta?.total ?? items.length;
  return {
    items,
    page: res.meta?.page ?? fallback.page,
    pageSize,
    totalCount,
    totalPages: res.meta?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}
