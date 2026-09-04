import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { usersApi } from '@/services/api/usersApi';
import type { User } from '@/types/domain';

export default function AdminUsersPage() {
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });

  const columns: Column<User>[] = [
    {
      header: 'Name',
      cell: (u) => (
        <span className="flex items-center gap-2">
          <Avatar name={u.name} size="sm" /> {u.name}
        </span>
      ),
    },
    { header: 'Username', cell: (u) => <span className="font-mono text-xs text-text-muted">{u.username}</span> },
    { header: 'Email', cell: (u) => <span className="text-text-muted">{u.email}</span> },
    { header: 'Role', cell: (u) => <Badge tone="neutral">{u.role}</Badge> },
    { header: 'Department', cell: (u) => u.departmentName ?? '—' },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="All accounts in the system" />
      <Card>
        <DataTable columns={columns} rows={data} rowKey={(u) => u.id} isLoading={isLoading} error={error} onRetry={() => refetch()} />
      </Card>
    </div>
  );
}
