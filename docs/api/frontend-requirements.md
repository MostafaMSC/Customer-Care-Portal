# Frontend API Requirements — Customer Care & Ticket Routing

This document is the contract handoff between this frontend (`frontend/customer-care-portal`)
and the backend (`Backend/`, ASP.NET Core). It was produced by inspecting the actual backend
source before writing any UI code, per the project's own rule: *"do not invent API endpoints
if equivalent backend endpoints already exist"* and *"if an API required by the frontend does
not exist, document it rather than faking it."*

## 1. What the backend already supports today

| Area | Endpoint | Notes |
|---|---|---|
| Auth | `POST /api/auth/login` | `{ Username, Password }` → `AuthResponse { accessToken, refreshToken, expiresAt, requires2FA, user }`. Sets httpOnly cookies. |
| Auth | `POST /api/auth/refresh` | Cookie-based refresh → `{ accessToken }`. |
| Auth | `GET /api/auth/me` | Returns `UserDto` (id, username, email, role, departmentId/Name, ...). |
| Auth | `POST /api/auth/logout` | Clears cookies. |
| Tickets | `GET /api/tickets` | Filter by type/status/priority/createdByUserId/assignedToUserId/search, paginated. |
| Tickets | `GET /api/tickets/{id}` | Returns `TicketDetailsDto` (comments + attachments). |
| Tickets | `POST /api/tickets` | Creates a `Ticket` (single `AssignedToUserId`, `TicketType` = IT_Support/PKI_Request/HR/Maintenance). |
| Tickets | `PUT /api/tickets/{id}/status` | Sets one of the approval-chain `TicketStatus` values. |
| Tickets | `PUT /api/tickets/{id}/assign` | `{ AssignedToUserId }` — single assignee only, `ManagerPolicy`. |
| Tickets | `POST /api/tickets/{id}/comments` | Single comment list, no internal/customer visibility flag. |
| Tickets | `GET /api/tickets/statistics` | Aggregate counts (open/in-progress/closed/escalated/by-priority). |
| Org | `Department` (has `ManagerId`), `UserInfo` (has `DepartmentId`, `Role: User/Manager/Administrator/HR`) | No `Customer` entity anywhere in the schema. |

This is a **single-department-less internal support desk** (IT/PKI/HR/Maintenance tickets
raised by employees, routed through an approval chain to one assignee). It does not model:
external customers, a department as a ticket's *current owner*, multi-employee/team
assignment, department transfer, cross-department collaboration, PBX/call linkage, or SLA
timestamps beyond a single `DueDate`.

## 2. What this frontend needs that does not exist yet

Everything below is currently served by an in-memory mock (`src/services/mock/`) behind the
same `services/api/*.ts` module boundary the real backend would sit behind
(`VITE_API_MODE=mock|real`). Only `authApi` can run in `real` mode today.

### 2.1 Domain additions

- **`Customer`** entity: `id, name, phone, email, company?`. Tickets need a customer, not just
  a `CreatedByUserId` (an internal employee).
- **`Ticket.CurrentDepartmentId`** (nullable) — the ticket's *current responsible department*,
  separate from any employee assignment. Not present on the current `Ticket` model.
- **`TicketAssignment`** + **`TicketAssignmentMember`** tables, exactly as specified in the
  product brief:
  ```
  TicketAssignment { Id, TicketId, DepartmentId, AssignedByUserId, AssignmentType
                     (Individual|MultipleEmployees|EntireDepartment), AssignedAt,
                     UnassignedAt, IsActive, Notes }
  TicketAssignmentMember { Id, AssignmentId, UserId, AddedAt, RemovedAt, IsActive }
  ```
  This replaces `Ticket.AssignedToUserId` for this workflow — a ticket must support zero,
  one, or many active assignees, and preserve every past assignment (never overwritten).
- **`DepartmentTransfer`**: `{ Id, TicketId, FromDepartmentId, ToDepartmentId,
  TransferredByUserId, Reason, TransferredAt }` — append-only.
- **`TicketDepartmentRequest`** (collaboration/assistance, distinct from transfer):
  `{ Id, TicketId, RequestingDepartmentId, TargetDepartmentId, RequestedBy, RequestedAt,
  Reason, Status (Pending|Responded|Completed|Declined), RespondedAt, Response }`.
- **`TicketComment.Visibility`**: `Customer | Internal` — the current `AddTicketCommentRequest`
  has no such flag, so internal notes and customer-facing replies are indistinguishable today.
- **`TicketStatus`** needs a customer-facing status machine
  (`New/Received/UnderReview/Assigned/InProgress/WaitingForCustomer/WaitingForDepartment/
  Transferred/Resolved/Closed/Reopened/Cancelled`) instead of the current internal
  approval-chain enum. These are different workflows; the backend team should decide whether
  to add a second enum/discriminator or generalize the existing one.
- **`Ticket.Source`**: `PhoneCall|CustomerPortal|CustomerCare|Email|Api|Pbx` plus a `CallInfo`
  value object (`CallId, CallerNumber, CallStart, CallEnd, AgentName, Extension,
  RecordingUrl?`) for PBX-originated tickets.
- **`Ticket.RequestedPriority` vs `Ticket.Priority`**: the customer's requested urgency and the
  actual triaged priority need to be distinct fields; today there is only one `Priority`.
- Permissions on `GET /api/auth/me`: the frontend currently derives a permission list from
  `role` client-side for the mock (`src/constants/permissions.ts`) purely for UI affordances.
  In real mode this is a placeholder (`permissions: []`) — **authorization must be enforced
  server-side regardless**, but returning an actual permission/claims list on `/me` would let
  the UI hide irrelevant actions correctly instead of guessing from `role` alone.

### 2.2 Endpoints needed

```
POST   /api/tickets                          Create ticket (customer or Customer Care), body per CreateTicketPayload
POST   /api/tickets/{id}/forward             { departmentId, reason, comment? } — Customer Care only, no employeeId(s)
POST   /api/tickets/{id}/assign              { employeeIds: string[], assignToEntireTeam: bool, comment? }
                                              — manager of ticket's current department only; reject if both
                                              employeeIds non-empty AND assignToEntireTeam true (400)
POST   /api/tickets/{id}/assignment/members  { action: 'add'|'remove', employeeId }
POST   /api/tickets/{id}/unassign            { note? } — returns ticket to department queue
POST   /api/tickets/{id}/transfer            { toDepartmentId, reason } — clears active assignment
POST   /api/tickets/{id}/collaboration       { targetDepartmentId, reason } — request assistance
POST   /api/tickets/{id}/collaboration/{reqId}/respond   { response, markCompleted: bool }
PUT    /api/tickets/{id}/priority            { priority }
PUT    /api/tickets/{id}/status              { status, note? } (extend existing endpoint with the new enum + note)
POST   /api/tickets/{id}/escalate            { reason? }
POST   /api/tickets/{id}/comments            { message, visibility: 'Customer'|'Internal' } (extend existing endpoint)
GET    /api/tickets/{id}                     extend TicketDetailsDto with: customer, source, callInfo, currentDepartment,
                                              currentAssignment, assignmentHistory[], transferHistory[],
                                              collaborationRequests[], timeline[] (see 2.3), slaResponseDueAt,
                                              slaResolutionDueAt, isOverdue, isEscalated, transfersCount, escalationsCount
GET    /api/tickets?scope=...                extend filters with: departmentId, unrouted, unassigned, assignedUserId,
                                              teamOnlyForDepartmentId, customerId, overdueOnly, criticalOnly, escalatedOnly
GET    /api/departments                      { id, name, description, managerId, managerName, employeeCount }[]
GET    /api/departments/{id}/team            employees of a department, for the assignment picker
GET    /api/customers?search=                lookup/typeahead for Customer Care ticket creation
GET    /api/notifications                    per-user feed (see 2.4)
POST   /api/notifications/{id}/read
GET    /api/reports/department-performance   received/resolved/closed/avgResponse/avgResolution/slaCompliance/
                                              overdue/transfers/reopened, filterable by department/date range
GET    /api/reports/employee-performance     same shape per employee
GET    /api/reports/ticket-analytics         distribution by source/priority/status/department
GET    /api/reports/management-kpis          totals/open/resolvedToday/overdue/slaCompliance/avgResolution
```

All list/paginated endpoints should return the existing `{ success, data }` envelope with
`data` shaped as `{ items, page, pageSize, totalCount, totalPages }`, matching the pattern
already used by `GET /api/tickets`.

### 2.3 Ticket timeline

The UI renders one unified, append-only timeline per ticket (`TimelineEvent { id, type,
occurredAt, actorName, summary, detail? }`) covering creation, forwarding, department receipt,
assignment/reassignment, unassignment, transfer, collaboration request/response, status &
priority changes, comments/internal notes, escalation, resolution, closure and reopening. The
backend does not currently persist any of these as discrete events (only `CreatedAt`/
`UpdatedAt`/`ResolvedAt` timestamps exist on `Ticket`). This should become its own audit table
rather than being reconstructed from other tables at read time, so the "management can later
see... complete ticket timeline" requirement (spec section 15/21) is backed by real history
rather than inference.

### 2.4 Notifications / real-time

Section 36 of the brief allows polling until SignalR is available. This frontend polls
`notificationsApi.list()` every 20s (mocked from ticket timeline events relevant to the signed
-in user). The backend should eventually expose a real notifications table/endpoint and,
longer-term, a SignalR hub the frontend can subscribe to (the existing backend already
depends on `@microsoft/signalr` in `frontend/zktecofront`, so there is precedent for this
transport).

### 2.5 Customer identity / portal auth

There is no `Customer`-role login path on the backend today (`UserType` = `User | Manager |
Administrator | HR`). The customer portal in this app assumes a `Customer` app role exists in
the identity system with its own login, distinct from the internal `UserInfo` employee
directory, and that a ticket's `CustomerId` can be resolved from the signed-in customer's
identity server-side (never trust a `customerId` supplied by the client for
`GET /api/tickets?scope=customer`).

## 3. Ticket type / priority / status mismatch

- Backend `TicketPriority`: `Low, Medium, High, Critical` (4 levels).
  This app's model: `Low, Normal, High, Urgent, Critical` (5 levels, with a separate
  *requested* vs *actual* priority). These need to be reconciled with the backend team before
  wiring real mode — either the backend adds `Normal`/`Urgent`, or the frontend maps down to 4.
- Backend `TicketType`: `IT_Support, PKI_Request, HR, Maintenance` — free-text
  `category`/`subCategory` strings are used here instead, since a customer-facing ticket's
  category set is department-driven, not a fixed enum tied to internal ticket types.

## 4. Non-negotiable server-side rules

These must be enforced in the backend, not only hidden in the UI (frontend gating is for UX
only, per spec section 40/17):

1. Customer Care can forward to a department but the forward request payload must have **no**
   employee/user id field at all — don't just ignore one client-side.
2. `POST /api/tickets/{id}/assign` must reject a caller who is not the manager of the ticket's
   *current* department (403), and reject `assignToEntireTeam: true` combined with a non-empty
   `employeeIds` (400).
3. A department transfer must deactivate the ticket's current assignment server-side even if
   the client doesn't ask for it.
4. Assignment/transfer/collaboration mutations must append to history tables, never update a
   single mutable "assigned to" column in place.
5. A customer-scoped ticket read/list must filter to `Internal`-visibility comments and
   department-routing fields being 403/omitted, not merely hidden by the frontend (this app's
   mock does this in `ticketsApi.get` via `toCustomerSafeDetail` today, precisely because the
   real backend doesn't yet do it).
