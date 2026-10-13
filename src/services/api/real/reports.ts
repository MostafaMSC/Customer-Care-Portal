/**
 * Real-mode reporting. The report endpoints are typed as free-form objects in the OpenAPI spec, so
 * their payloads are read defensively (case-insensitive, several candidate names) and anything
 * missing falls back to figures derived from the typed ticket endpoints.
 */
import { apiClient } from '../client';
import type {
  DepartmentPerformanceRow,
  EmployeePerformanceRow,
  ManagementKpis,
  ReportFilters,
  TicketAnalytics,
} from '@/types/reports';
import type { DepartmentDto, Envelope, Paged, TicketSummaryDto } from './dto';
import { ticketSummaryToListItem } from './mappers';

type Row = Record<string, unknown>;

function field(row: unknown, ...names: string[]): unknown {
  if (!row || typeof row !== 'object') return undefined;
  const entries = Object.entries(row as Row);
  for (const name of names) {
    const hit = entries.find(([k]) => k.toLowerCase() === name.toLowerCase());
    if (hit && hit[1] !== null && hit[1] !== undefined) return hit[1];
  }
  return undefined;
}
const num = (row: unknown, ...names: string[]): number => {
  const v = Number(field(row, ...names));
  return Number.isFinite(v) ? v : 0;
};
const str = (row: unknown, ...names: string[]): string | undefined => {
  const v = field(row, ...names);
  return typeof v === 'string' ? v : undefined;
};

/** The first array found at the top level or one level down: `[...]`, `{ rows: [...] }`, `{ departments: [...] }`. */
function rowsOf(data: unknown): Row[] {
  if (Array.isArray(data)) return data as Row[];
  if (data && typeof data === 'object') {
    const arr = Object.values(data as Row).find(Array.isArray);
    if (arr) return arr as Row[];
  }
  return [];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

async function fetchTickets(max = 500): Promise<TicketSummaryDto[]> {
  const out: TicketSummaryDto[] = [];
  for (let page = 1; out.length < max; page += 1) {
    const res = await apiClient.get<Paged<TicketSummaryDto>>('/api/tickets', { params: { page, pageSize: 100 } });
    out.push(...(res.data.items ?? []));
    if (page >= (res.data.meta?.totalPages ?? 1)) break;
  }
  return out;
}

async function count(params: Record<string, unknown> = {}): Promise<number> {
  const res = await apiClient.get<Paged<TicketSummaryDto>>('/api/tickets', { params: { ...params, page: 1, pageSize: 1 } });
  return res.data.meta?.total ?? 0;
}

async function performanceData(filters: ReportFilters): Promise<unknown> {
  try {
    const res = await apiClient.get<Envelope<unknown>>('/api/reports/departments/performance', { params: { departmentId: filters.departmentId } });
    return res.data.data;
  } catch {
    return undefined;
  }
}

export async function managementKpis(): Promise<ManagementKpis> {
  const [total, resolved, closed, overdue, resolvedRecent, perf] = await Promise.all([
    count(),
    count({ status: 'RESOLVED' }),
    count({ status: 'CLOSED' }),
    count({ overdue: true }),
    apiClient.get<Paged<TicketSummaryDto>>('/api/tickets', { params: { status: 'RESOLVED', sort: 'updatedAt', order: 'desc', pageSize: 100 } }),
    performanceData({}),
  ]);
  const today = new Date().toDateString();
  const resolvedToday = (resolvedRecent.data.items ?? []).filter((t) => t.updatedAt && new Date(t.updatedAt).toDateString() === today).length;
  const perfRows = rowsOf(perf);
  const avgs = perfRows.map((r) => num(r, 'avgResolutionHours', 'averageResolutionHours')).filter((v) => v > 0);
  return {
    totalTickets: total,
    openTickets: Math.max(0, total - resolved - closed),
    resolvedToday,
    overdueTickets: overdue,
    slaCompliancePct: total ? Math.round(((total - overdue) / total) * 100) : 100,
    avgResolutionHours: avgs.length ? round1(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0,
  };
}

export async function departmentPerformance(filters: ReportFilters = {}): Promise<DepartmentPerformanceRow[]> {
  const rows = rowsOf(await performanceData(filters));
  const fromReport = rows
    .map((r) => ({
      departmentId: str(r, 'departmentId') ?? str(field(r, 'department'), 'id') ?? '',
      departmentName: str(r, 'departmentName', 'name') ?? str(field(r, 'department'), 'name') ?? '—',
      received: num(r, 'received', 'ticketsReceived', 'total', 'totalTickets'),
      resolved: num(r, 'resolved', 'resolvedCount', 'ticketsResolved'),
      closed: num(r, 'closed', 'closedCount'),
      avgResponseHours: round1(num(r, 'avgResponseHours', 'averageResponseHours')),
      avgResolutionHours: round1(num(r, 'avgResolutionHours', 'averageResolutionHours')),
      slaCompliancePct: num(r, 'slaCompliancePct', 'slaCompliance', 'slaPercent'),
      overdue: num(r, 'overdue', 'overdueCount'),
      transfers: num(r, 'transfers', 'transferCount', 'transferred'),
      reopened: num(r, 'reopened', 'reopenCount'),
    }))
    .filter((r) => r.departmentId || r.departmentName !== '—');
  if (fromReport.length) return fromReport;

  // Fallback: aggregate by owning department from the ticket list.
  const tickets = await fetchTickets();
  const byDept = new Map<string, TicketSummaryDto[]>();
  for (const t of tickets) {
    const id = t.currentDepartment?.id;
    if (!id || (filters.departmentId && id !== filters.departmentId)) continue;
    byDept.set(id, [...(byDept.get(id) ?? []), t]);
  }
  return [...byDept.values()].map((list) => {
    const overdue = list.filter((t) => t.isOverdue).length;
    return {
      departmentId: list[0].currentDepartment!.id,
      departmentName: list[0].currentDepartment!.name ?? '—',
      received: list.length,
      resolved: list.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
      closed: list.filter((t) => t.status === 'CLOSED').length,
      avgResponseHours: 0,
      avgResolutionHours: 0,
      slaCompliancePct: list.length ? Math.round(((list.length - overdue) / list.length) * 100) : 100,
      overdue,
      transfers: 0,
      reopened: 0,
    };
  });
}

export async function employeePerformance(filters: ReportFilters = {}): Promise<EmployeePerformanceRow[]> {
  let departments: DepartmentDto[];
  if (filters.departmentId) {
    departments = [{ id: filters.departmentId }];
  } else {
    departments = (await apiClient.get<Envelope<DepartmentDto[]>>('/api/departments')).data.data.filter((d) => d.kind !== 'CUSTOMER_CARE');
  }

  const perDept = await Promise.all(
    departments.map(async (d) => {
      try {
        const res = await apiClient.get<Envelope<unknown>>(`/api/reports/departments/${d.id}/workload`);
        return rowsOf(res.data.data).map((r) => ({ row: r, departmentName: d.name }));
      } catch {
        return [];
      }
    }),
  );

  return perDept.flat().map(({ row, departmentName }) => ({
    userId: str(row, 'userId') ?? str(field(row, 'user'), 'id') ?? '',
    userName: str(row, 'userName', 'fullName', 'name') ?? str(field(row, 'user'), 'fullName') ?? '—',
    departmentName: departmentName ?? str(row, 'departmentName') ?? '—',
    assigned: num(row, 'assigned', 'assignedCount', 'active', 'open', 'total'),
    completed: num(row, 'completed', 'resolved', 'resolvedCount'),
    avgResponseHours: round1(num(row, 'avgResponseHours', 'averageResponseHours')),
    avgResolutionHours: round1(num(row, 'avgResolutionHours', 'averageResolutionHours')),
    slaCompliancePct: num(row, 'slaCompliancePct', 'slaCompliance') || 100,
    overdue: num(row, 'overdue', 'overdueCount'),
    reopened: num(row, 'reopened', 'reopenCount'),
  }));
}

export async function ticketAnalytics(): Promise<TicketAnalytics> {
  const items = (await fetchTickets()).map((t) => ticketSummaryToListItem(t));
  const tally = (labels: string[]) => {
    const counts = labels.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l]: (acc[l] ?? 0) + 1 }), {});
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  };
  return {
    bySource: tally(items.map((t) => t.source)),
    byPriority: tally(items.map((t) => t.priority)),
    byStatus: tally(items.map((t) => t.status)),
    byDepartment: tally(items.map((t) => t.currentDepartmentName ?? 'Unrouted')),
  };
}

/** Full lifecycle report of one ticket (durations, participants, SLA, department history). Shape is open-ended. */
export async function ticketLifecycle(ticketId: string): Promise<Record<string, unknown>> {
  const res = await apiClient.get<Envelope<Record<string, unknown>>>(`/api/reports/tickets/${ticketId}/lifecycle`);
  return res.data.data;
}
