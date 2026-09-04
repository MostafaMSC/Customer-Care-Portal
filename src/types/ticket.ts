/**
 * Ticket domain model implementing the Customer Care -> Department -> Manager ->
 * Employee(s) routing/assignment hierarchy. Modelled explicitly as current-state
 * (fast to query) + historical records (assignment/transfer/status/priority),
 * per the "do not collapse to Ticket{DepartmentId, EmployeeId, Status}" rule.
 */

export const TicketSource = {
  PhoneCall: 'PhoneCall',
  CustomerPortal: 'CustomerPortal',
  CustomerCare: 'CustomerCare',
  Email: 'Email',
  Api: 'Api',
  Pbx: 'Pbx',
} as const;
export type TicketSource = (typeof TicketSource)[keyof typeof TicketSource];

export const TicketPriority = {
  Low: 'Low',
  Normal: 'Normal',
  High: 'High',
  Urgent: 'Urgent',
  Critical: 'Critical',
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

export const TicketStatus = {
  New: 'New',
  Received: 'Received',
  UnderReview: 'UnderReview',
  Assigned: 'Assigned',
  InProgress: 'InProgress',
  WaitingForCustomer: 'WaitingForCustomer',
  WaitingForDepartment: 'WaitingForDepartment',
  Transferred: 'Transferred',
  Resolved: 'Resolved',
  Closed: 'Closed',
  Reopened: 'Reopened',
  Cancelled: 'Cancelled',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const AssignmentType = {
  Individual: 'Individual',
  MultipleEmployees: 'MultipleEmployees',
  EntireDepartment: 'EntireDepartment',
} as const;
export type AssignmentType = (typeof AssignmentType)[keyof typeof AssignmentType];

export const CollaborationStatus = {
  Pending: 'Pending',
  Responded: 'Responded',
  Completed: 'Completed',
  Declined: 'Declined',
} as const;
export type CollaborationStatus = (typeof CollaborationStatus)[keyof typeof CollaborationStatus];

export const TimelineEventType = {
  Created: 'Created',
  Forwarded: 'Forwarded',
  DepartmentReceived: 'DepartmentReceived',
  Assigned: 'Assigned',
  AssignmentChanged: 'AssignmentChanged',
  Unassigned: 'Unassigned',
  Transferred: 'Transferred',
  CollaborationRequested: 'CollaborationRequested',
  CollaborationResponded: 'CollaborationResponded',
  StatusChanged: 'StatusChanged',
  PriorityChanged: 'PriorityChanged',
  CommentAdded: 'CommentAdded',
  InternalNoteAdded: 'InternalNoteAdded',
  CustomerResponded: 'CustomerResponded',
  Escalated: 'Escalated',
  Resolved: 'Resolved',
  Closed: 'Closed',
  Reopened: 'Reopened',
} as const;
export type TimelineEventType = (typeof TimelineEventType)[keyof typeof TimelineEventType];

export interface CallInfo {
  callId: string;
  callerNumber: string;
  callStart: string;
  callEnd?: string;
  agentName: string;
  extension?: string;
  recordingUrl?: string;
}

export interface TicketAssignmentMember {
  id: string;
  userId: string;
  userName: string;
  addedAt: string;
  removedAt?: string | null;
  isActive: boolean;
}

/** TicketAssignment: current or historical assignment of a ticket within its owning department. */
export interface TicketAssignment {
  id: string;
  ticketId: string;
  departmentId: string;
  departmentName: string;
  assignedByUserId: string;
  assignedByUserName: string;
  assignmentType: AssignmentType;
  members: TicketAssignmentMember[];
  assignedAt: string;
  unassignedAt?: string | null;
  isActive: boolean;
  notes?: string;
}

/** Department ownership transfer record (previous department loses responsibility). */
export interface DepartmentTransfer {
  id: string;
  ticketId: string;
  fromDepartmentId: string;
  fromDepartmentName: string;
  toDepartmentId: string;
  toDepartmentName: string;
  transferredByUserId: string;
  transferredByUserName: string;
  reason: string;
  transferredAt: string;
}

/** TicketDepartmentRequest: cross-department assistance without changing ownership. */
export interface CollaborationRequest {
  id: string;
  ticketId: string;
  requestingDepartmentId: string;
  requestingDepartmentName: string;
  targetDepartmentId: string;
  targetDepartmentName: string;
  requestedByUserId: string;
  requestedByUserName: string;
  requestedAt: string;
  reason: string;
  status: CollaborationStatus;
  respondedAt?: string | null;
  response?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  visibility: 'Customer' | 'Internal';
  message: string;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  url: string;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedAt: string;
  sizeBytes: number;
}

export interface TimelineEvent {
  id: string;
  ticketId: string;
  type: TimelineEventType;
  occurredAt: string;
  actorName: string;
  summary: string;
  detail?: string;
}

export interface CustomerRef {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/** Lightweight row shape for tables. */
export interface TicketListItem {
  id: string;
  number: string;
  subject: string;
  customerName: string;
  source: TicketSource;
  priority: TicketPriority;
  status: TicketStatus;
  currentDepartmentId?: string;
  currentDepartmentName?: string;
  assignmentType?: AssignmentType;
  assignedNames: string[];
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  isEscalated: boolean;
}

export interface Ticket extends TicketListItem {
  description: string;
  category?: string;
  subCategory?: string;
  requestedPriority: TicketPriority;
  callInfo?: CallInfo;
  customer: CustomerRef;
  createdByUserId: string;
  createdByUserName: string;
  slaResponseDueAt?: string;
  slaResolutionDueAt?: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  transfersCount: number;
  escalationsCount: number;
  currentAssignment?: TicketAssignment | null;
}

export interface TicketDetail extends Ticket {
  comments: TicketComment[];
  attachments: TicketAttachment[];
  timeline: TimelineEvent[];
  assignmentHistory: TicketAssignment[];
  transferHistory: DepartmentTransfer[];
  collaborationRequests: CollaborationRequest[];
}

export interface TicketStatistics {
  incoming: number;
  unassigned: number;
  assigned: number;
  team: number;
  inProgress: number;
  waiting: number;
  overdue: number;
  critical: number;
  resolved: number;
  slaAtRisk: number;
}

// ---- Request payloads for the assignment/routing operations ----

export interface CreateTicketPayload {
  subject: string;
  description: string;
  category?: string;
  subCategory?: string;
  requestedPriority: TicketPriority;
  customer: { name: string; phone: string; email?: string };
  source: TicketSource;
  callInfo?: CallInfo;
}

export interface ForwardTicketPayload {
  departmentId: string;
  reason: string;
  comment?: string;
}

export interface AssignTicketPayload {
  employeeIds: string[];
  assignToEntireTeam: boolean;
  comment?: string;
}

export interface TransferTicketPayload {
  toDepartmentId: string;
  reason: string;
}

export interface RequestAssistancePayload {
  targetDepartmentId: string;
  reason: string;
}

export interface RespondAssistancePayload {
  requestId: string;
  response: string;
  markCompleted: boolean;
}
