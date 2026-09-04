import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { departmentsApi } from '@/services/api/departmentsApi';
import type { Department } from '@/types/domain';

export default function DepartmentsPage() {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list });

  const columns: Column<Department>[] = [
    { header: 'Department', cell: (d) => <span className="font-medium text-text">{d.name}</span> },
    { header: 'Description', cell: (d) => <span className="text-text-muted">{d.description ?? '—'}</span> },
    { header: 'Manager', cell: (d) => d.managerName ?? '—' },
    { header: 'Employees', cell: (d) => d.employeeCount },
  ];

  return (
    <div>
      <PageHeader title="Departments" subtitle="Routing destinations and their managers" />
      <Card>
        <DataTable columns={columns} rows={data} rowKey={(d) => d.id} isLoading={isLoading} error={error} onRetry={() => refetch()} />
      </Card>
    </div>
  );
}
