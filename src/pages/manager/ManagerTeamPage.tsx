import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { reportsApi } from '@/services/api/reportsApi';
import { useAuthStore } from '@/store/authStore';
import type { EmployeePerformanceRow } from '@/types/reports';

export default function ManagerTeamPage() {
  const user = useAuthStore((s) => s.user)!;
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'employee-performance', user.departmentId],
    queryFn: () => reportsApi.employeePerformance({ departmentId: user.departmentId }),
  });

  const columns: Column<EmployeePerformanceRow>[] = [
    {
      header: 'Employee',
      cell: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={r.userName} size="sm" /> {r.userName}
        </span>
      ),
    },
    { header: 'Assigned', cell: (r) => r.assigned },
    { header: 'Completed', cell: (r) => r.completed },
    { header: 'Overdue', cell: (r) => (r.overdue > 0 ? <Badge tone="danger">{r.overdue}</Badge> : r.overdue) },
    { header: 'Avg. Resolution', cell: (r) => `${r.avgResolutionHours}h` },
    { header: 'SLA Compliance', cell: (r) => <Badge tone={r.slaCompliancePct >= 90 ? 'success' : 'warning'}>{r.slaCompliancePct}%</Badge> },
  ];

  return (
    <div>
      <PageHeader title="My Team" subtitle={`${user.departmentName} - current workload per employee`} />
      <Card>
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(r) => r.userId}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          emptyTitle="No active work"
          emptyDescription="Nobody on your team currently has tickets assigned."
        />
      </Card>
    </div>
  );
}
