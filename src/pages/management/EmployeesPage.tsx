import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Field';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { reportsApi } from '@/services/api/reportsApi';
import { departmentsApi } from '@/services/api/departmentsApi';
import type { EmployeePerformanceRow } from '@/types/reports';

export default function EmployeesPage() {
  const [departmentId, setDepartmentId] = useState('');
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list });
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'employee-performance', departmentId],
    queryFn: () => reportsApi.employeePerformance({ departmentId: departmentId || undefined }),
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
    { header: 'Department', cell: (r) => <span className="text-text-muted">{r.departmentName}</span> },
    { header: 'Assigned', cell: (r) => r.assigned },
    { header: 'Completed', cell: (r) => r.completed },
    { header: 'Overdue', cell: (r) => (r.overdue > 0 ? <Badge tone="danger">{r.overdue}</Badge> : r.overdue) },
    { header: 'Reopened', cell: (r) => r.reopened },
    { header: 'Avg. Resolution', cell: (r) => `${r.avgResolutionHours}h` },
    { header: 'SLA Compliance', cell: (r) => <Badge tone={r.slaCompliancePct >= 90 ? 'success' : 'warning'}>{r.slaCompliancePct}%</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Workload and performance across all departments"
        actions={
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-48">
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        }
      />
      <Card>
        <DataTable columns={columns} rows={data} rowKey={(r) => r.userId} isLoading={isLoading} error={error} onRetry={() => refetch()} />
      </Card>
    </div>
  );
}
