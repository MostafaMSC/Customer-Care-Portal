/**
 * Switches every API module between the real Call Center backend and the in-memory mock.
 *
 * `VITE_API_MODE=real` sends all traffic (auth, tickets, routing/assignment, lifecycle, collaboration,
 * queues, departments, users, customers, reports) to `VITE_API_BASE_URL` - see docs/api/openapi.json
 * for the contract and `services/api/real/` for the DTO mappers. Anything else uses the mock, which
 * lets the UI be built and demoed without a backend.
 *
 * The backend has no notifications or telephony endpoints yet; in real mode the notification bell
 * stays empty.
 */
export const API_MODE: 'mock' | 'real' = import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'mock';

export const isRealMode = API_MODE === 'real';
