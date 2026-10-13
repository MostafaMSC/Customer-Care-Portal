/**
 * Wire types for the Call Center System backend. Mirrors the OpenAPI schemas in
 * docs/api/openapi.json (served at /api/docs). Keep these in sync with the spec;
 * everything the UI consumes goes through ./mappers.ts, never these shapes directly.
 */

export type ApiRole = 'ADMIN' | 'MANAGEMENT' | 'CUSTOMER_CARE' | 'DEPARTMENT_MANAGER' | 'EMPLOYEE' | 'CUSTOMER';
export type ApiStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type ApiPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type ApiSource = 'PHONE_CALL' | 'EMAIL' | 'WEB' | 'CHAT' | 'WALK_IN' | 'MOBILE_APP' | 'INTERNAL';
export type ApiAssignmentType = 'INDIVIDUAL' | 'MULTIPLE_EMPLOYEES' | 'ENTIRE_DEPARTMENT';
export type ApiWaitingReason = 'CUSTOMER' | 'ANOTHER_DEPARTMENT' | 'EXTERNAL_PARTY' | 'OTHER';
export type ApiVisibility = 'PUBLIC' | 'INTERNAL';
export type ApiCollaborationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

type Nullable<T> = T | null | undefined;

export interface Envelope<T> {
  data: T;
}

export interface Paged<T> {
  items: T[];
  meta?: { page?: number; pageSize?: number; total?: number; totalPages?: number };
}

export interface UserSummaryDto {
  id: string;
  fullName?: string;
  email?: string;
  role?: ApiRole;
  jobTitle?: Nullable<string>;
  primaryDepartmentId?: Nullable<string>;
  isActive?: boolean;
  phone?: Nullable<string>;
  customerId?: Nullable<string>;
}

export interface DepartmentSummaryDto {
  id: string;
  name?: string;
  code?: string;
  kind?: 'CUSTOMER_CARE' | 'OPERATIONS';
}

export interface DepartmentDto extends DepartmentSummaryDto {
  description?: Nullable<string>;
  isActive?: boolean;
  slaHours?: Nullable<number>;
  memberCount?: number;
  openTicketCount?: number;
  /** Present on GET /departments/{id} ("with its managers and members"). */
  managers?: UserSummaryDto[];
  members?: UserSummaryDto[];
}

export interface CustomerDto {
  id: string;
  code?: string;
  fullName?: string;
  companyName?: Nullable<string>;
  primaryPhone?: string;
  altPhone?: Nullable<string>;
  email?: Nullable<string>;
  address?: Nullable<string>;
  isActive?: boolean;
  createdAt?: Nullable<string>;
}

export interface AssignmentMemberDto {
  id: string;
  user?: UserSummaryDto;
  viaTeamAssignment?: boolean;
  addedAt?: Nullable<string>;
  removedAt?: Nullable<string>;
  isActive?: boolean;
}

export interface AssignmentDto {
  id: string;
  ticketId?: string;
  department?: DepartmentSummaryDto;
  assignmentType?: ApiAssignmentType;
  assignedBy?: UserSummaryDto;
  assignedTo?: Nullable<UserSummaryDto>;
  notes?: Nullable<string>;
  assignedAt?: Nullable<string>;
  unassignedAt?: Nullable<string>;
  isActive?: boolean;
  members?: AssignmentMemberDto[];
}

export interface DepartmentPeriodDto {
  id: string;
  department?: DepartmentSummaryDto;
  previousDepartment?: Nullable<DepartmentSummaryDto>;
  action?: 'CREATED' | 'FORWARDED' | 'TRANSFERRED';
  startedBy?: Nullable<UserSummaryDto>;
  reason?: Nullable<string>;
  startedAt?: Nullable<string>;
  endedAt?: Nullable<string>;
  isCurrent?: boolean;
  durationMinutes?: number;
}

export interface CollaborationRequestDto {
  id: string;
  requestingDepartment?: DepartmentSummaryDto;
  targetDepartment?: DepartmentSummaryDto;
  requestedBy?: UserSummaryDto;
  requestedAt?: Nullable<string>;
  reason?: string;
  status?: ApiCollaborationStatus;
  respondedAt?: Nullable<string>;
  response?: Nullable<string>;
}

export interface TicketSummaryDto {
  id: string;
  number?: string;
  subject?: string;
  status?: ApiStatus;
  priority?: ApiPriority;
  source?: ApiSource;
  customer?: CustomerDto;
  currentDepartment?: Nullable<DepartmentSummaryDto>;
  createdAt?: Nullable<string>;
  updatedAt?: Nullable<string>;
  dueAt?: Nullable<string>;
  isOverdue?: boolean;
  isEscalated?: boolean;
  isAssigned?: boolean;
  assignmentType?: Nullable<ApiAssignmentType>;
  participants?: UserSummaryDto[];
}

export interface TicketDto extends TicketSummaryDto {
  description?: string;
  customerRequestedPriority?: Nullable<ApiPriority>;
  waitingReason?: Nullable<ApiWaitingReason>;
  waitingNote?: Nullable<string>;
  createdBy?: UserSummaryDto;
  forwardedBy?: Nullable<UserSummaryDto>;
  forwardedAt?: Nullable<string>;
  originDepartment?: Nullable<DepartmentSummaryDto>;
  currentAssignment?: Nullable<AssignmentDto>;
  departmentHistory?: DepartmentPeriodDto[];
  collaborationRequests?: CollaborationRequestDto[];
  call?: { reference?: Nullable<string>; startedAt?: Nullable<string>; endedAt?: Nullable<string>; contactPhone?: Nullable<string> };
  slaBreached?: boolean;
  escalationCount?: number;
  transferCount?: number;
  reopenCount?: number;
  resolvedAt?: Nullable<string>;
  resolutionNote?: Nullable<string>;
  closedAt?: Nullable<string>;
}

export interface TimelineEventDto {
  id: string;
  type?: string;
  message?: string;
  actor?: Nullable<UserSummaryDto>;
  payload?: Nullable<Record<string, unknown>>;
  visibility?: ApiVisibility;
  createdAt?: Nullable<string>;
}

export interface CommentDto {
  id: string;
  ticketId?: string;
  author?: UserSummaryDto;
  body?: string;
  visibility?: ApiVisibility;
  createdAt?: Nullable<string>;
}

export interface AttachmentDto {
  id: string;
  ticketId?: string;
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  visibility?: ApiVisibility;
  uploadedBy?: UserSummaryDto;
  createdAt?: Nullable<string>;
}

export interface ProfileDto {
  id: string;
  email?: string;
  fullName?: string;
  role?: ApiRole;
  jobTitle?: Nullable<string>;
  customerId?: Nullable<string>;
  primaryDepartment?: Nullable<DepartmentSummaryDto>;
  departments?: DepartmentSummaryDto[];
  managedDepartmentIds?: string[];
  permissions?: string[];
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken?: string;
  user?: ProfileDto;
}

export interface DepartmentQueueSummaryDto {
  department?: DepartmentSummaryDto;
  buckets?: Partial<Record<'incoming' | 'unassigned' | 'assigned' | 'team' | 'inProgress' | 'waiting' | 'overdue' | 'critical' | 'needsAttention' | 'resolved' | 'all', number>>;
}

export interface EmployeeQueueSummaryDto {
  buckets?: Partial<Record<'assigned' | 'inProgress' | 'waiting' | 'overdue' | 'team' | 'resolved' | 'all', number>>;
}
