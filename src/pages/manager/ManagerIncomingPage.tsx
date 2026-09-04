import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { TicketTable } from '@/features/tickets/components/TicketTable';
import { useTicketList } from '@/features/tickets/hooks/useTicketList';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

export default function ManagerIncomingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user)!;
  const { data, isLoading, error, refetch } = useTicketList({
    scope: 'department-queue',
    departmentId: user.departmentId,
    statuses: ['WaitingForDepartment'],
    pageSize: 20,
  });

  return (
    <div>
      <PageHeader
        title="Incoming Tickets"
        subtitle="Tickets recently forwarded by Customer Care - assign them to an employee, multiple employees, or your entire team"
      />
      <Card>
        <TicketTable
          rows={data?.items ?? []}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onRowClick={(t) => navigate(ROUTES.manager.ticket(t.id))}
          variant="manager"
          emptyTitle="No incoming tickets"
          emptyDescription="New tickets forwarded to your department will appear here."
        />
      </Card>
    </div>
  );
}
