import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/Badge';
import { reportsApi } from '@/services/api/reportsApi';
import type { DepartmentPerformanceRow } from '@/types/reports';

const CHART_COLORS = ['#2f5fd6', '#1f8a4c', '#b5790a', '#d33a3a', '#1670a6', '#5b6472'];

export default function ReportsPage() {
  const { data: deptRows = [], isLoading: loadingDept, error: deptError, refetch: refetchDept } = useQuery({
    queryKey: ['reports', 'department-performance'],
    queryFn: () => reportsApi.departmentPerformance(),
  });
  const { data: analytics } = useQuery({ queryKey: ['reports', 'ticket-analytics'], queryFn: reportsApi.ticketAnalytics });

  const columns: Column<DepartmentPerformanceRow>[] = [
    { header: 'Department', cell: (r) => <span className="font-medium text-text">{r.departmentName}</span> },
    { header: 'Received', cell: (r) => r.received },
    { header: 'Resolved', cell: (r) => r.resolved },
    { header: 'Closed', cell: (r) => r.closed },
    { header: 'Avg. Response', cell: (r) => `${r.avgResponseHours}h` },
    { header: 'Avg. Resolution', cell: (r) => `${r.avgResolutionHours}h` },
    { header: 'SLA Compliance', cell: (r) => <Badge tone={r.slaCompliancePct >= 90 ? 'success' : 'warning'}>{r.slaCompliancePct}%</Badge> },
    { header: 'Overdue', cell: (r) => (r.overdue > 0 ? <Badge tone="danger">{r.overdue}</Badge> : r.overdue) },
    { header: 'Transfers', cell: (r) => r.transfers },
    { header: 'Reopened', cell: (r) => r.reopened },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Department performance and ticket analytics" />

      <Card className="mb-5">
        <CardHeader title="Department Performance" />
        <DataTable columns={columns} rows={deptRows} rowKey={(r) => r.departmentId} isLoading={loadingDept} error={deptError} onRetry={() => refetchDept()} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tickets by Department" />
          <CardBody className="h-72">
            {analytics && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2f5fd6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tickets by Priority" />
          <CardBody className="h-72">
            {analytics && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.byPriority} dataKey="value" nameKey="label" outerRadius={90} label>
                    {analytics.byPriority.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tickets by Source" />
          <CardBody className="h-72">
            {analytics && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.bySource} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1f8a4c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tickets by Status" />
          <CardBody className="h-72">
            {analytics && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.byStatus} dataKey="value" nameKey="label" outerRadius={90} label>
                    {analytics.byStatus.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
