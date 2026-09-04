# Customer Care & Ticket Routing Portal

Enterprise frontend for the Customer Care → Department → Manager → Employee(s) ticket routing
and assignment workflow. React + TypeScript + Vite, built against the real FingerPrint backend
where it already applies, and a documented mock service for the parts of the domain the
backend does not implement yet (see `docs/api/frontend-requirements.md`).

## Requirements

- Node.js 20+ and npm 10+

## Installation

```bash
npm install
```

## Environment variables

Copy `.env.example` to `.env` and adjust:

```
VITE_API_BASE_URL=http://localhost:5830   # FingerPrint backend base URL
VITE_API_MODE=mock                        # "mock" (default) or "real"
```

`VITE_API_MODE=mock` serves the full ticket-routing domain (departments-on-ticket,
multi-employee/team assignment, transfer, cross-department collaboration, the customer
portal, SLA/report data) from an in-memory seed so the whole app is usable end-to-end today.
`VITE_API_MODE=real` switches authentication to the real backend (`/api/auth/login|refresh|
me|logout`); every other module still needs the endpoints listed in
`docs/api/frontend-requirements.md` before it can run against the real API.

## Development

```bash
npm run dev
```

Opens on `http://localhost:5173`. In mock mode, sign in with any of the seeded usernames and
password `password123`:

| Username | Role | Notes |
|---|---|---|
| `sara`, `omar` | Customer Care | Review/forward incoming tickets |
| `layla` | Manager | Network department — incoming queue, assignment, transfer |
| `zainab`, `tariq`, `yousif`, `rasha` | Manager | Infrastructure / IT Support / Finance / HR |
| `ahmed`, `mohammed`, `ali`, `hassan`, `karim`, `rana`, `dana` | Employee | Assigned work |
| `mustafa` | Customer | Customer portal |
| `nadia` | Management | Cross-department reporting |
| `admin` | Administrator | Sees everything |

## Production build

```bash
npm run build      # tsc -b && vite build
npm run preview    # serve the production build locally
```

## Other scripts

```bash
npm run typecheck  # tsc -b --noEmit
npm run lint        # eslint .
npm run format      # prettier --write .
```

## Project structure

```
src/
  app/           router (protected routes), providers (TanStack Query), config
  components/    design system primitives (ui/), layout, tables, feedback (empty/error/skeleton/toaster)
  constants/     routes, nav-by-role, permissions-by-role, status/priority display metadata
  features/
    tickets/     the shared ticket feature: list/detail views, dialogs (assign/forward/
                 transfer/collaborate/...), badges, timeline, hooks
    notifications/
  hooks/         useAuth, usePermission
  pages/         route-level pages grouped by experience: customer, customer-care, employee,
                 manager, management, admin, auth, errors
  services/
    api/         one module per domain (authApi, ticketsApi, departmentsApi, usersApi,
                 customersApi, reportsApi, notificationsApi) + the shared axios client
    mock/        in-memory seed data + mock "backend" the api/ modules call in mock mode
  store/         zustand: auth (persisted) and UI (toasts, sidebar)
  types/         domain, ticket, api, reports type definitions
docs/api/frontend-requirements.md   contracts this app needs that the backend doesn't expose yet
```

## Authentication

`authApi` is the only module with a real backend integration: it mirrors the cookie-based
refresh flow already used by `frontend/zktecofront` (`withCredentials`, a 401 → refresh →
retry-once axios interceptor, tokens kept in a persisted zustand store). Every other domain
module currently always runs against the mock service, since the backend has no ticket-routing
domain yet — see `docs/api/frontend-requirements.md` for the exact gap and endpoint contracts.

## Roles & permissions

Six experiences, each with its own route subtree and sidebar (`src/pages/*`,
`src/constants/nav.ts`): Customer, Customer Care, Employee, Manager, Management, Administrator.
`RequireRole` (`src/app/router/RequireRole.tsx`) hides routes a role shouldn't see and
`usePermission()` gates individual actions (assign, transfer, escalate, ...) — this is for
navigation/UX only. The backend remains the sole source of truth for authorization; nothing
here should be treated as a security boundary.

## Mock mode

`src/services/mock/` holds the seed data (`seedOrg.ts`: departments/users/customers,
`seedTickets.ts`: ~15 tickets covering every status, transfer, multi-assignment, entire-team
assignment and collaboration case from the spec) and `db.ts`, a small in-memory store with the
same mutation rules the real backend must eventually enforce (a manager can only assign
tickets owned by their own department, `assignToEntireTeam` and `employeeIds` are mutually
exclusive, a transfer clears the active assignment, etc.). Each `services/api/*.ts` module is
the seam where a real implementation replaces the mock call — no component talks to
`services/mock` directly.

## Testing

No automated test suite is set up yet. Manual verification performed for this build: full
login → role-dashboard flow for every role, ticket forward (Customer Care), individual/
multiple/entire-team assignment, reassignment, unassignment, department transfer, cross
-department assistance request/response, priority/status changes, escalation, and the
management reports/analytics charts — all against the mock backend via a headless browser,
with zero console errors.
