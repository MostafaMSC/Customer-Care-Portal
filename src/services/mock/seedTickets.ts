import {
  AssignmentType,
  CollaborationStatus,
  TicketPriority,
  TicketSource,
  TicketStatus,
  TimelineEventType,
  type CollaborationRequest,
  type DepartmentTransfer,
  type TicketAssignment,
  type TicketAssignmentMember,
  type TicketComment,
  type TicketDetail,
  type TimelineEvent,
} from '@/types/ticket';
import { customers, departments, users } from './seedOrg';
import { iso, nextId } from './helpers';

function dept(id: string) {
  const d = departments.find((x) => x.id === id)!;
  return { id: d.id, name: d.name };
}
function person(id: string) {
  const u = users.find((x) => x.id === id)!;
  return { id: u.id, name: u.name };
}
function customer(id: string) {
  const c = customers.find((x) => x.id === id)!;
  return { id: c.id, name: c.name, phone: c.phone, email: c.email };
}

function member(userId: string, addedAt: string, removedAt: string | null = null): TicketAssignmentMember {
  const u = person(userId);
  return { id: nextId('mem'), userId: u.id, userName: u.name, addedAt, removedAt, isActive: !removedAt };
}

function assignment(opts: {
  departmentId: string;
  assignedBy: string;
  type: keyof typeof AssignmentType;
  members: TicketAssignmentMember[];
  assignedAt: string;
  unassignedAt?: string | null;
  isActive?: boolean;
  notes?: string;
}): TicketAssignment {
  const d = dept(opts.departmentId);
  const by = person(opts.assignedBy);
  return {
    id: nextId('asg'),
    ticketId: '',
    departmentId: d.id,
    departmentName: d.name,
    assignedByUserId: by.id,
    assignedByUserName: by.name,
    assignmentType: AssignmentType[opts.type],
    members: opts.members,
    assignedAt: opts.assignedAt,
    unassignedAt: opts.unassignedAt ?? null,
    isActive: opts.isActive ?? true,
    notes: opts.notes,
  };
}

function event(type: keyof typeof TimelineEventType, occurredAt: string, actor: string, summary: string, detail?: string): TimelineEvent {
  return {
    id: nextId('evt'),
    ticketId: '',
    type: TimelineEventType[type],
    occurredAt,
    actorName: actor === 'Customer' ? 'Customer' : person(actor).name,
    summary,
    detail,
  };
}

function comment(opts: {
  author: string;
  authorRole: string;
  visibility: 'Customer' | 'Internal';
  message: string;
  createdAt: string;
}): TicketComment {
  const isCustomer = opts.author === 'Customer';
  return {
    id: nextId('cmt'),
    ticketId: '',
    authorId: isCustomer ? 'customer' : person(opts.author).id,
    authorName: isCustomer ? 'Customer' : person(opts.author).name,
    authorRole: opts.authorRole,
    visibility: opts.visibility,
    message: opts.message,
    createdAt: opts.createdAt,
  };
}

let ticketCounter = 119;
function ticketNumber(): string {
  ticketCounter += 1;
  return `TKT-2026-${String(ticketCounter).padStart(5, '0')}`;
}

interface Build {
  id: string;
  number: string;
  subject: string;
  description: string;
  category?: string;
  subCategory?: string;
  source: TicketSource;
  callInfo?: TicketDetail['callInfo'];
  customerId: string;
  createdByUserId: string;
  requestedPriority: TicketPriority;
  priority: TicketPriority;
  status: TicketStatus;
  currentDepartmentId?: string;
  currentAssignment?: TicketAssignment | null;
  createdAt: string;
  updatedAt: string;
  slaResponseDueAt?: string;
  slaResolutionDueAt?: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  isEscalated?: boolean;
  escalationsCount?: number;
  timeline: TimelineEvent[];
  comments?: TicketComment[];
  assignmentHistory?: TicketAssignment[];
  transferHistory?: DepartmentTransfer[];
  collaborationRequests?: CollaborationRequest[];
}

function build(b: Build): TicketDetail {
  const id = b.id;
  const cust = customer(b.customerId);
  const createdBy = person(b.createdByUserId);
  const deptRef = b.currentDepartmentId ? dept(b.currentDepartmentId) : undefined;
  const timeline = b.timeline.map((t) => ({ ...t, ticketId: id }));
  const now = new Date();
  const isOverdue = !!b.slaResolutionDueAt && new Date(b.slaResolutionDueAt) < now && !b.resolvedAt && !b.closedAt;

  return {
    id,
    number: b.number,
    subject: b.subject,
    description: b.description,
    category: b.category,
    subCategory: b.subCategory,
    source: b.source,
    callInfo: b.callInfo,
    customer: cust,
    createdByUserId: createdBy.id,
    createdByUserName: createdBy.name,
    customerName: cust.name,
    requestedPriority: b.requestedPriority,
    priority: b.priority,
    status: b.status,
    currentDepartmentId: deptRef?.id,
    currentDepartmentName: deptRef?.name,
    assignmentType: b.currentAssignment?.assignmentType,
    assignedNames: b.currentAssignment?.members.filter((m) => m.isActive).map((m) => m.userName) ?? [],
    currentAssignment: b.currentAssignment ? { ...b.currentAssignment, ticketId: id } : null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    slaResponseDueAt: b.slaResponseDueAt,
    slaResolutionDueAt: b.slaResolutionDueAt,
    resolvedAt: b.resolvedAt ?? null,
    closedAt: b.closedAt ?? null,
    isOverdue,
    isEscalated: b.isEscalated ?? false,
    transfersCount: b.transferHistory?.length ?? 0,
    escalationsCount: b.escalationsCount ?? 0,
    comments: (b.comments ?? []).map((c) => ({ ...c, ticketId: id })),
    attachments: [],
    timeline,
    assignmentHistory: (b.assignmentHistory ?? (b.currentAssignment ? [b.currentAssignment] : [])).map((a) => ({
      ...a,
      ticketId: id,
    })),
    transferHistory: (b.transferHistory ?? []).map((t) => ({ ...t, ticketId: id })),
    collaborationRequests: (b.collaborationRequests ?? []).map((c) => ({ ...c, ticketId: id })),
  };
}

// ---------------------------------------------------------------------------
// Showcase tickets - each demonstrates one part of the routing/assignment spec
// ---------------------------------------------------------------------------

const t1 = build({
  id: 'tkt-120',
  number: ticketNumber(),
  subject: 'Cannot access the customer web portal',
  description: 'I get a blank page whenever I try to log into the customer portal since this morning.',
  category: 'Portal',
  source: TicketSource.CustomerPortal,
  customerId: 'cust-3',
  createdByUserId: 'cust-user-mustafa',
  requestedPriority: TicketPriority.Normal,
  priority: TicketPriority.Normal,
  status: TicketStatus.New,
  createdAt: iso(0, 8, 10),
  updatedAt: iso(0, 8, 10),
  timeline: [event('Created', iso(0, 8, 10), 'Customer', 'Ticket created via Customer Portal')],
});

const t2 = build({
  id: 'tkt-121',
  number: ticketNumber(),
  subject: 'Billing amount looks incorrect on latest invoice',
  description: 'Caller says the latest invoice total does not match the agreed plan price.',
  category: 'Billing',
  source: TicketSource.PhoneCall,
  callInfo: {
    callId: 'CALL-88213',
    callerNumber: '+964 771 222 3344',
    callStart: iso(0, 9, 0),
    callEnd: iso(0, 9, 12),
    agentName: 'Sara Ibrahim',
    extension: '2201',
  },
  customerId: 'cust-2',
  createdByUserId: 'user-sara',
  requestedPriority: TicketPriority.Normal,
  priority: TicketPriority.Normal,
  status: TicketStatus.UnderReview,
  createdAt: iso(0, 9, 5),
  updatedAt: iso(0, 9, 12),
  timeline: [
    event('Created', iso(0, 9, 5), 'user-sara', 'Ticket created from phone call CALL-88213'),
  ],
  comments: [
    comment({ author: 'user-sara', authorRole: 'Customer Care', visibility: 'Internal', message: 'Customer disputes the last invoice line item. Needs Finance to review before we forward.', createdAt: iso(0, 9, 13) }),
  ],
});

const forwardedAssignment122 = null;
const t3 = build({
  id: 'tkt-122',
  number: ticketNumber(),
  subject: 'Office WiFi keeps disconnecting every few minutes',
  description: 'Repeated connectivity drops reported from the 3rd floor office WiFi over the last two days.',
  category: 'Connectivity',
  subCategory: 'WiFi',
  source: TicketSource.PhoneCall,
  callInfo: {
    callId: 'CALL-88250',
    callerNumber: '+964 772 333 4455',
    callStart: iso(-1, 14, 0),
    callEnd: iso(-1, 14, 9),
    agentName: 'Omar Al-Tikriti',
    extension: '2202',
  },
  customerId: 'cust-3',
  createdByUserId: 'user-omar',
  requestedPriority: TicketPriority.High,
  priority: TicketPriority.High,
  status: TicketStatus.WaitingForDepartment,
  currentDepartmentId: 'dept-network',
  createdAt: iso(-1, 14, 5),
  updatedAt: iso(-1, 14, 20),
  slaResponseDueAt: iso(0, 14, 5),
  timeline: [
    event('Created', iso(-1, 14, 5), 'user-omar', 'Ticket created from phone call CALL-88250'),
    event('Forwarded', iso(-1, 14, 20), 'user-omar', 'Forwarded to Network department', 'Reason: Repeated connectivity drops reported'),
    event('DepartmentReceived', iso(-1, 14, 21), 'user-layla', 'Received into Network incoming queue'),
  ],
  currentAssignment: forwardedAssignment122,
});

const asg123 = assignment({
  departmentId: 'dept-network',
  assignedBy: 'user-layla',
  type: 'Individual',
  members: [member('user-ahmed', iso(-2, 10, 10))],
  assignedAt: iso(-2, 10, 10),
});
const t4 = build({
  id: 'tkt-123',
  number: ticketNumber(),
  subject: 'VPN drops when connecting from home network',
  description: 'Customer cannot keep a stable VPN session for more than 5 minutes while working remotely.',
  category: 'Connectivity',
  subCategory: 'VPN',
  source: TicketSource.Email,
  customerId: 'cust-4',
  createdByUserId: 'user-sara',
  requestedPriority: TicketPriority.High,
  priority: TicketPriority.High,
  status: TicketStatus.InProgress,
  currentDepartmentId: 'dept-network',
  currentAssignment: asg123,
  createdAt: iso(-2, 9, 30),
  updatedAt: iso(-2, 11, 0),
  slaResponseDueAt: iso(-1, 9, 30),
  slaResolutionDueAt: iso(1, 9, 30),
  timeline: [
    event('Created', iso(-2, 9, 30), 'user-sara', 'Ticket created via email'),
    event('Forwarded', iso(-2, 9, 45), 'user-sara', 'Forwarded to Network department'),
    event('DepartmentReceived', iso(-2, 9, 50), 'user-layla', 'Received into Network incoming queue'),
    event('Assigned', iso(-2, 10, 10), 'user-layla', 'Assigned to Ahmed Yousef'),
    event('StatusChanged', iso(-2, 11, 0), 'user-ahmed', 'Status changed to In Progress'),
  ],
  comments: [
    comment({ author: 'Customer', authorRole: 'Customer', visibility: 'Customer', message: 'It disconnects almost every time I open a video call.', createdAt: iso(-2, 9, 32) }),
    comment({ author: 'user-ahmed', authorRole: 'Network Engineer', visibility: 'Internal', message: 'Checking VPN concentrator logs for this customer IP range.', createdAt: iso(-2, 11, 5) }),
  ],
});

// TKT-2026-00125 - the flagship example from the spec (multi-assign + collaboration + resolution)
ticketCounter = 124; // force the next generated number to be exactly ...00125
const asg125 = assignment({
  departmentId: 'dept-network',
  assignedBy: 'user-layla',
  type: 'MultipleEmployees',
  members: [member('user-ahmed', iso(-1, 10, 10)), member('user-mohammed', iso(-1, 10, 15))],
  assignedAt: iso(-1, 10, 10),
  notes: 'Requires investigation from network team',
});
const t5 = build({
  id: 'tkt-125',
  number: ticketNumber(),
  subject: 'Network connection problem at branch office',
  description: 'Customer reports intermittent total loss of network connectivity at the branch office, several times per day.',
  category: 'Connectivity',
  subCategory: 'LAN',
  source: TicketSource.PhoneCall,
  callInfo: {
    callId: 'CALL-88300',
    callerNumber: '+964 770 111 2233',
    callStart: iso(-1, 9, 58),
    callEnd: iso(-1, 10, 8),
    agentName: 'Sara Ibrahim',
    extension: '2201',
    recordingUrl: '#',
  },
  customerId: 'cust-1',
  createdByUserId: 'user-sara',
  requestedPriority: TicketPriority.High,
  priority: TicketPriority.Urgent,
  status: TicketStatus.Closed,
  currentDepartmentId: 'dept-network',
  currentAssignment: { ...asg125, isActive: false, unassignedAt: iso(-1, 13, 20) },
  createdAt: iso(-1, 10, 0),
  updatedAt: iso(-1, 13, 20),
  slaResponseDueAt: iso(-1, 12, 0),
  slaResolutionDueAt: iso(-1, 18, 0),
  resolvedAt: iso(-1, 13, 20),
  closedAt: iso(-1, 15, 30),
  timeline: [
    event('Created', iso(-1, 10, 0), 'user-sara', 'Ticket created from phone call CALL-88300', 'Source = Phone Call'),
    event('Forwarded', iso(-1, 10, 0), 'user-sara', 'Customer Care forwarded ticket to Network Department'),
    event('DepartmentReceived', iso(-1, 10, 5), 'user-layla', 'Network Manager received ticket'),
    event('Assigned', iso(-1, 10, 10), 'user-layla', 'Network Manager assigned ticket to Ahmed Yousef'),
    event('AssignmentChanged', iso(-1, 10, 15), 'user-layla', 'Network Manager added Mohammed Kareem to the assignment'),
    event('CollaborationRequested', iso(-1, 11, 30), 'user-ahmed', 'Assistance requested from Infrastructure', 'Reason: Need to confirm core switch uplink is stable'),
    event('CollaborationResponded', iso(-1, 12, 15), 'user-karim', 'Infrastructure responded to the assistance request'),
    event('Resolved', iso(-1, 13, 20), 'user-ahmed', 'Network resolved the issue'),
    event('CustomerResponded', iso(-1, 14, 40), 'Customer', 'Customer confirmed the connection is stable'),
    event('Closed', iso(-1, 15, 30), 'user-layla', 'Ticket closed'),
  ],
  comments: [
    comment({ author: 'Customer', authorRole: 'Customer', visibility: 'Customer', message: 'Connection keeps dropping several times a day, please help urgently.', createdAt: iso(-1, 10, 2) }),
    comment({ author: 'user-ahmed', authorRole: 'Network Engineer', visibility: 'Internal', message: 'Uplink on the branch switch looks unstable, looping in Infrastructure to check the core switch side.', createdAt: iso(-1, 11, 28) }),
    comment({ author: 'user-karim', authorRole: 'Systems Administrator', visibility: 'Internal', message: 'Core switch port 14 showed CRC errors, replaced the patch cable and reset the port counters.', createdAt: iso(-1, 12, 10) }),
    comment({ author: 'user-mohammed', authorRole: 'Network Engineer', visibility: 'Customer', message: 'We identified a faulty cable on our side and replaced it. Connection should now be stable - please confirm.', createdAt: iso(-1, 13, 25) }),
    comment({ author: 'Customer', authorRole: 'Customer', visibility: 'Customer', message: 'Confirmed, it has been stable for the last hour. Thank you!', createdAt: iso(-1, 14, 40) }),
  ],
  collaborationRequests: [
    {
      id: nextId('collab'),
      ticketId: '',
      requestingDepartmentId: 'dept-network',
      requestingDepartmentName: 'Network',
      targetDepartmentId: 'dept-infra',
      targetDepartmentName: 'Infrastructure',
      requestedByUserId: 'user-ahmed',
      requestedByUserName: 'Ahmed Yousef',
      requestedAt: iso(-1, 11, 30),
      reason: 'Need to confirm core switch uplink is stable for the branch office segment.',
      status: CollaborationStatus.Completed,
      respondedAt: iso(-1, 12, 15),
      response: 'Core switch port 14 had CRC errors; cable replaced and port counters reset.',
    },
  ],
});

// TKT-2026-00130 - assignment history changes (add / remove members)
const asg130Active = assignment({
  departmentId: 'dept-network',
  assignedBy: 'user-layla',
  type: 'MultipleEmployees',
  members: [member('user-ahmed', iso(-3, 10, 10)), member('user-ali', iso(-3, 11, 30))],
  assignedAt: iso(-3, 10, 10),
});
const t6 = build({
  id: 'tkt-130',
  number: ticketNumber(),
  subject: 'Slow file transfer speeds between branch offices',
  description: 'File copy between HQ and branch office fileserver is far slower than the contracted bandwidth.',
  category: 'Performance',
  source: TicketSource.CustomerCare,
  customerId: 'cust-4',
  createdByUserId: 'user-omar',
  requestedPriority: TicketPriority.Normal,
  priority: TicketPriority.Normal,
  status: TicketStatus.InProgress,
  currentDepartmentId: 'dept-network',
  currentAssignment: asg130Active,
  createdAt: iso(-3, 9, 0),
  updatedAt: iso(-3, 11, 30),
  timeline: [
    event('Created', iso(-3, 9, 0), 'user-omar', 'Ticket created'),
    event('Forwarded', iso(-3, 9, 5), 'user-omar', 'Forwarded to Network department'),
    event('DepartmentReceived', iso(-3, 9, 10), 'user-layla', 'Network Manager received ticket'),
    event('Assigned', iso(-3, 10, 10), 'user-layla', 'Network Manager assigned ticket to Ahmed Yousef'),
    event('AssignmentChanged', iso(-3, 10, 15), 'user-layla', 'Network Manager added Mohammed Kareem'),
    event('AssignmentChanged', iso(-3, 11, 20), 'user-layla', 'Network Manager removed Mohammed Kareem'),
    event('AssignmentChanged', iso(-3, 11, 30), 'user-layla', 'Network Manager assigned Ali Jabbar'),
  ],
  assignmentHistory: [
    assignment({ departmentId: 'dept-network', assignedBy: 'user-layla', type: 'Individual', members: [member('user-ahmed', iso(-3, 10, 10))], assignedAt: iso(-3, 10, 10), unassignedAt: iso(-3, 10, 15), isActive: false }),
    assignment({ departmentId: 'dept-network', assignedBy: 'user-layla', type: 'MultipleEmployees', members: [member('user-ahmed', iso(-3, 10, 10)), member('user-mohammed', iso(-3, 10, 15), iso(-3, 11, 20))], assignedAt: iso(-3, 10, 15), unassignedAt: iso(-3, 11, 20), isActive: false }),
    asg130Active,
  ],
});

// TKT-2026-00135 - entire team assignment
const asg135 = assignment({
  departmentId: 'dept-network',
  assignedBy: 'user-layla',
  type: 'EntireDepartment',
  members: [],
  assignedAt: iso(-1, 9, 0),
  notes: 'Team investigation required',
});
const t7 = build({
  id: 'tkt-135',
  number: ticketNumber(),
  subject: 'Planned data center network migration support',
  description: 'Need coordinated network support during the weekend data center migration window.',
  category: 'Change Request',
  source: TicketSource.CustomerCare,
  customerId: 'cust-2',
  createdByUserId: 'user-sara',
  requestedPriority: TicketPriority.Normal,
  priority: TicketPriority.Normal,
  status: TicketStatus.Assigned,
  currentDepartmentId: 'dept-network',
  currentAssignment: asg135,
  createdAt: iso(-1, 8, 30),
  updatedAt: iso(-1, 9, 0),
  timeline: [
    event('Created', iso(-1, 8, 30), 'user-sara', 'Ticket created'),
    event('Forwarded', iso(-1, 8, 35), 'user-sara', 'Forwarded to Network department'),
    event('DepartmentReceived', iso(-1, 8, 40), 'user-layla', 'Network Manager received ticket'),
    event('Assigned', iso(-1, 9, 0), 'user-layla', 'Assigned to the entire Network team', 'Team investigation required'),
  ],
});

// TKT-2026-00140 - transfer Network -> Infrastructure -> Network (per spec section 8)
const t8 = build({
  id: 'tkt-140',
  number: ticketNumber(),
  subject: 'Data center cooling alarm intermittently triggers network switch reboot',
  description: 'A recurring alarm appears to be power-cycling a network switch stack in the data center.',
  category: 'Infrastructure',
  source: TicketSource.CustomerCare,
  customerId: 'cust-5',
  createdByUserId: 'user-omar',
  requestedPriority: TicketPriority.High,
  priority: TicketPriority.High,
  status: TicketStatus.WaitingForDepartment,
  currentDepartmentId: 'dept-network',
  currentAssignment: null,
  createdAt: iso(-4, 9, 0),
  updatedAt: iso(-2, 16, 0),
  timeline: [
    event('Created', iso(-4, 9, 0), 'user-omar', 'Ticket created'),
    event('Forwarded', iso(-4, 9, 10), 'user-omar', 'Forwarded to Network department'),
    event('DepartmentReceived', iso(-4, 9, 15), 'user-layla', 'Network Manager received ticket'),
    event('Assigned', iso(-4, 9, 30), 'user-layla', 'Assigned to Ahmed Yousef and Ali Jabbar'),
    event('Transferred', iso(-3, 10, 0), 'user-layla', 'Transferred from Network to Infrastructure', 'Root cause appears to be a data center power/cooling system, not the network configuration'),
    event('DepartmentReceived', iso(-3, 10, 5), 'user-zainab', 'Infrastructure Manager received ticket'),
    event('Assigned', iso(-3, 10, 30), 'user-zainab', 'Assigned to Karim Saleh and Ali Jabbar'),
    event('Transferred', iso(-2, 16, 0), 'user-zainab', 'Transferred back from Infrastructure to Network', 'Cooling issue resolved; recurring switch reboots need network-side verification'),
    event('DepartmentReceived', iso(-2, 16, 5), 'user-layla', 'Network Manager received ticket'),
  ],
  assignmentHistory: [
    assignment({ departmentId: 'dept-network', assignedBy: 'user-layla', type: 'MultipleEmployees', members: [member('user-ahmed', iso(-4, 9, 30), iso(-3, 10, 0)), member('user-ali', iso(-4, 9, 30), iso(-3, 10, 0))], assignedAt: iso(-4, 9, 30), unassignedAt: iso(-3, 10, 0), isActive: false }),
    assignment({ departmentId: 'dept-infra', assignedBy: 'user-zainab', type: 'MultipleEmployees', members: [member('user-karim', iso(-3, 10, 30), iso(-2, 16, 0)), member('user-ali', iso(-3, 10, 30), iso(-2, 16, 0))], assignedAt: iso(-3, 10, 30), unassignedAt: iso(-2, 16, 0), isActive: false },
    ),
  ],
  transferHistory: [
    { id: nextId('trf'), ticketId: '', fromDepartmentId: 'dept-network', fromDepartmentName: 'Network', toDepartmentId: 'dept-infra', toDepartmentName: 'Infrastructure', transferredByUserId: 'user-layla', transferredByUserName: 'Layla Hassan', reason: 'Root cause appears to be a data center power/cooling system, not the network configuration', transferredAt: iso(-3, 10, 0) },
    { id: nextId('trf'), ticketId: '', fromDepartmentId: 'dept-infra', fromDepartmentName: 'Infrastructure', toDepartmentId: 'dept-network', toDepartmentName: 'Network', transferredByUserId: 'user-zainab', transferredByUserName: 'Zainab Noor', reason: 'Cooling issue resolved; recurring switch reboots need network-side verification', transferredAt: iso(-2, 16, 0) },
  ],
});

const asg150 = assignment({
  departmentId: 'dept-it',
  assignedBy: 'user-tariq',
  type: 'Individual',
  members: [member('user-dana', iso(-6, 9, 0))],
  assignedAt: iso(-6, 9, 0),
});
const t9 = build({
  id: 'tkt-150',
  number: ticketNumber(),
  subject: 'Point-of-sale terminals offline company-wide',
  description: 'All point-of-sale terminals across branches lost connectivity to the central server this morning.',
  category: 'Outage',
  source: TicketSource.PhoneCall,
  callInfo: { callId: 'CALL-88410', callerNumber: '+964 773 444 5566', callStart: iso(-6, 8, 0), callEnd: iso(-6, 8, 6), agentName: 'Sara Ibrahim', extension: '2201' },
  customerId: 'cust-4',
  createdByUserId: 'user-sara',
  requestedPriority: TicketPriority.Critical,
  priority: TicketPriority.Critical,
  status: TicketStatus.InProgress,
  currentDepartmentId: 'dept-it',
  currentAssignment: asg150,
  createdAt: iso(-6, 8, 3),
  updatedAt: iso(-5, 9, 0),
  slaResponseDueAt: iso(-6, 9, 3),
  slaResolutionDueAt: iso(-5, 8, 3),
  isEscalated: true,
  escalationsCount: 1,
  timeline: [
    event('Created', iso(-6, 8, 3), 'user-sara', 'Ticket created from phone call CALL-88410'),
    event('Forwarded', iso(-6, 8, 4), 'user-sara', 'Forwarded to IT Support department'),
    event('DepartmentReceived', iso(-6, 8, 6), 'user-tariq', 'IT Support Manager received ticket'),
    event('Assigned', iso(-6, 9, 0), 'user-tariq', 'Assigned to Dana Sami'),
    event('Escalated', iso(-5, 8, 30), 'user-tariq', 'Escalated - SLA resolution target missed'),
  ],
  comments: [
    comment({ author: 'user-dana', authorRole: 'IT Support Specialist', visibility: 'Internal', message: 'Central POS gateway service crashed, restarting and monitoring.', createdAt: iso(-6, 9, 30) }),
  ],
});

const t10 = build({
  id: 'tkt-155',
  number: ticketNumber(),
  subject: 'Printer on 2nd floor not responding',
  description: 'Shared office printer stopped responding to print jobs from any workstation.',
  category: 'Hardware',
  source: TicketSource.CustomerPortal,
  customerId: 'cust-5',
  createdByUserId: 'cust-user-mustafa',
  requestedPriority: TicketPriority.Low,
  priority: TicketPriority.Low,
  status: TicketStatus.Reopened,
  currentDepartmentId: 'dept-it',
  currentAssignment: assignment({ departmentId: 'dept-it', assignedBy: 'user-tariq', type: 'Individual', members: [member('user-dana', iso(-10, 9, 0))], assignedAt: iso(-10, 9, 0) }),
  createdAt: iso(-10, 8, 0),
  updatedAt: iso(0, 8, 0),
  resolvedAt: iso(-9, 10, 0),
  timeline: [
    event('Created', iso(-10, 8, 0), 'Customer', 'Ticket created via Customer Portal'),
    event('Forwarded', iso(-10, 8, 10), 'user-sara', 'Forwarded to IT Support department'),
    event('Assigned', iso(-10, 9, 0), 'user-tariq', 'Assigned to Dana Sami'),
    event('Resolved', iso(-9, 10, 0), 'user-dana', 'Marked resolved - printer reset'),
    event('Closed', iso(-9, 10, 5), 'user-tariq', 'Ticket closed'),
    event('Reopened', iso(0, 8, 0), 'Customer', 'Customer reopened the ticket - issue recurring'),
  ],
});

const t11 = build({
  id: 'tkt-160',
  number: ticketNumber(),
  subject: 'Duplicate ticket - please ignore',
  description: 'Created by mistake, same issue already reported separately.',
  category: 'General',
  source: TicketSource.CustomerPortal,
  customerId: 'cust-2',
  createdByUserId: 'cust-user-mustafa',
  requestedPriority: TicketPriority.Low,
  priority: TicketPriority.Low,
  status: TicketStatus.Cancelled,
  createdAt: iso(-5, 8, 0),
  updatedAt: iso(-5, 8, 30),
  timeline: [
    event('Created', iso(-5, 8, 0), 'Customer', 'Ticket created via Customer Portal'),
    event('StatusChanged', iso(-5, 8, 30), 'user-sara', 'Status changed to Cancelled', 'Duplicate of another ticket'),
  ],
});

const t12 = build({
  id: 'tkt-165',
  number: ticketNumber(),
  subject: 'Request for additional VPN licenses',
  description: 'Need 10 additional VPN licenses provisioned for new hires starting next week.',
  category: 'Provisioning',
  source: TicketSource.Email,
  customerId: 'cust-1',
  createdByUserId: 'user-omar',
  requestedPriority: TicketPriority.Normal,
  priority: TicketPriority.Normal,
  status: TicketStatus.WaitingForCustomer,
  currentDepartmentId: 'dept-network',
  currentAssignment: assignment({ departmentId: 'dept-network', assignedBy: 'user-layla', type: 'Individual', members: [member('user-hassan', iso(-2, 9, 0))], assignedAt: iso(-2, 9, 0) }),
  createdAt: iso(-2, 8, 0),
  updatedAt: iso(-1, 9, 0),
  timeline: [
    event('Created', iso(-2, 8, 0), 'user-omar', 'Ticket created via email'),
    event('Forwarded', iso(-2, 8, 5), 'user-omar', 'Forwarded to Network department'),
    event('Assigned', iso(-2, 9, 0), 'user-layla', 'Assigned to Hassan Fadhil'),
    event('CustomerResponded', iso(-1, 9, 0), 'user-hassan', 'Requested confirmation of exact user list from customer'),
  ],
  comments: [
    comment({ author: 'user-hassan', authorRole: 'Network Technician', visibility: 'Customer', message: 'Could you send the exact list of names/emails for the 10 new licenses?', createdAt: iso(-1, 9, 0) }),
  ],
});

const t13 = build({
  id: 'tkt-170',
  number: ticketNumber(),
  subject: 'Invoice PDF not received by email',
  description: 'Monthly invoice PDF was not delivered to the billing contact email this cycle.',
  category: 'Billing',
  source: TicketSource.Api,
  customerId: 'cust-3',
  createdByUserId: 'user-sara',
  requestedPriority: TicketPriority.Low,
  priority: TicketPriority.Low,
  status: TicketStatus.Resolved,
  currentDepartmentId: 'dept-finance',
  currentAssignment: { ...assignment({ departmentId: 'dept-finance', assignedBy: 'user-yousif', type: 'Individual', members: [member('user-lina', iso(-3, 9, 0))], assignedAt: iso(-3, 9, 0) }), isActive: false, unassignedAt: iso(-3, 12, 0) },
  createdAt: iso(-3, 8, 0),
  updatedAt: iso(-3, 12, 0),
  resolvedAt: iso(-3, 12, 0),
  timeline: [
    event('Created', iso(-3, 8, 0), 'user-sara', 'Ticket created'),
    event('Forwarded', iso(-3, 8, 5), 'user-sara', 'Forwarded to Finance department'),
    event('Assigned', iso(-3, 9, 0), 'user-yousif', 'Assigned to Lina Abbas'),
    event('Resolved', iso(-3, 12, 0), 'user-lina', 'Resent invoice PDF to billing contact'),
  ],
});

export const seedTickets: TicketDetail[] = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13];
