/**
 * Switches each API module between the real backend and the in-memory mock.
 *
 * Today only auth (`authApi`) can run in "real" mode against the actual
 * FingerPrint backend (POST /api/auth/login, GET /api/auth/me, ...). Every other
 * domain module (tickets, departments, users, customers, reports, notifications,
 * telephony) implements the routing/assignment workflow this app was built for,
 * which the backend does not expose yet - see /docs/api/frontend-requirements.md.
 * Those modules always run against the mock service until the backend catches up.
 */
export const API_MODE: 'mock' | 'real' = import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'mock';

export const isRealMode = API_MODE === 'real';
