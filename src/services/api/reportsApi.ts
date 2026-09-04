import type {
  DepartmentPerformanceRow,
  EmployeePerformanceRow,
  ManagementKpis,
  ReportFilters,
  TicketAnalytics,
} from '@/types/reports';
import { delay } from '@/services/mock/helpers';
import * as db from '@/services/mock/db';
import { departments, users } from '@/services/mock/seedOrg';
import { isUserInvolvedInTicket } from '@/services/mock/db';

function hoursBetween(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null;
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000);
}

export const reportsApi = {
  async managementKpis(): Promise<ManagementKpis> {
    const all = db.queryTickets({});
    const today = new Date().toDateString();
    const resolvedToday = all.filter((t) => t.resolvedAt && new Date(t.resolvedAt).toDateString() === today).length;
    const open = all.filter((t) => !['Resolved', 'Closed', 'Cancelled'].includes(t.status)).length;
    const overdue = all.filter((t) => t.isOverdue).length;
    const resolutionTimes = all.map((t) => hoursBetween(t.createdAt, t.resolvedAt)).filter((v): v is number => v !== null);
    const avgResolutionHours = resolutionTimes.length ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length : 0;
    const closedOrResolved = all.filter((t) => t.resolvedAt || t.closedAt).length;
    const withinSla = all.filter((t) => (t.resolvedAt || t.closedAt) && !t.isOverdue).length;
    return delay({
      totalTickets: all.length,
      openTickets: open,
      resolvedToday,
      overdueTickets: overdue,
      slaCompliancePct: closedOrResolved ? Math.round((withinSla / closedOrResolved) * 100) : 100,
      avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
    });
  },

  async departmentPerformance(filters: ReportFilters = {}): Promise<DepartmentPerformanceRow[]> {
    const target = filters.departmentId ? departments.filter((d) => d.id === filters.departmentId) : departments.filter((d) => d.id !== 'dept-cc');
    const rows: DepartmentPerformanceRow[] = target.map((dept) => {
      const touched = db.queryTickets({}).filter(
        (t) => t.currentDepartmentId === dept.id || t.transferHistory.some((h) => h.fromDepartmentId === dept.id || h.toDepartmentId === dept.id) || t.assignmentHistory.some((a) => a.departmentId === dept.id),
      );
      const resolved = touched.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
      const closed = touched.filter((t) => t.status === 'Closed').length;
      const responseTimes = touched
        .map((t) => hoursBetween(t.createdAt, t.timeline.find((e) => e.type === 'DepartmentReceived' && e.actorName)?.occurredAt))
        .filter((v): v is number => v !== null);
      const resolutionTimes = touched.map((t) => hoursBetween(t.createdAt, t.resolvedAt)).filter((v): v is number => v !== null);
      const overdue = touched.filter((t) => t.isOverdue).length;
      const transfers = touched.filter((t) => t.transferHistory.length > 0).length;
      const reopened = touched.filter((t) => t.status === 'Reopened').length;
      const closedOrResolved = touched.filter((t) => t.resolvedAt || t.closedAt).length;
      const withinSla = touched.filter((t) => (t.resolvedAt || t.closedAt) && !t.isOverdue).length;
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        received: touched.length,
        resolved,
        closed,
        avgResponseHours: avg(responseTimes),
        avgResolutionHours: avg(resolutionTimes),
        slaCompliancePct: closedOrResolved ? Math.round((withinSla / closedOrResolved) * 100) : 100,
        overdue,
        transfers,
        reopened,
      };
    });
    return delay(rows);
  },

  async employeePerformance(filters: ReportFilters = {}): Promise<EmployeePerformanceRow[]> {
    const pool = users.filter((u) => u.role === 'Employee' || u.role === 'Manager');
    const filtered = filters.departmentId ? pool.filter((u) => u.departmentId === filters.departmentId) : pool;
    const all = db.queryTickets({});
    const rows: EmployeePerformanceRow[] = filtered.map((u) => {
      const assignedTickets = all.filter((t) => isUserInvolvedInTicket(t, u) !== null || t.assignmentHistory.some((a) => a.members.some((m) => m.userId === u.id)));
      const completed = assignedTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
      const resolutionTimes = assignedTickets.map((t) => hoursBetween(t.createdAt, t.resolvedAt)).filter((v): v is number => v !== null);
      const overdue = assignedTickets.filter((t) => t.isOverdue).length;
      const reopened = assignedTickets.filter((t) => t.status === 'Reopened').length;
      const closedOrResolved = assignedTickets.filter((t) => t.resolvedAt || t.closedAt).length;
      const withinSla = assignedTickets.filter((t) => (t.resolvedAt || t.closedAt) && !t.isOverdue).length;
      return {
        userId: u.id,
        userName: u.name,
        departmentName: u.departmentName ?? '—',
        assigned: assignedTickets.length,
        completed,
        avgResponseHours: 0.6,
        avgResolutionHours: avg(resolutionTimes),
        slaCompliancePct: closedOrResolved ? Math.round((withinSla / closedOrResolved) * 100) : 100,
        overdue,
        reopened,
      };
    });
    return delay(rows.filter((r) => r.assigned > 0));
  },

  async ticketAnalytics(): Promise<TicketAnalytics> {
    const all = db.queryTickets({});
    const count = <T extends string>(items: T[]) =>
      Object.entries(
        items.reduce<Record<string, number>>((acc, v) => {
          acc[v] = (acc[v] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([label, value]) => ({ label, value }));

    return delay({
      bySource: count(all.map((t) => t.source)),
      byPriority: count(all.map((t) => t.priority)),
      byStatus: count(all.map((t) => t.status)),
      byDepartment: count(all.map((t) => t.currentDepartmentName ?? 'Unrouted')),
    });
  },
};

function avg(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
