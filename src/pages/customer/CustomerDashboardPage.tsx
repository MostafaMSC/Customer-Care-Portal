import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { TicketTable } from '@/features/tickets/components/TicketTable';
import { useTicketList } from '@/features/tickets/hooks/useTicketList';
import { ticketsApi } from '@/services/api/ticketsApi';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

export default function CustomerDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: counts = [] } = useQuery({ queryKey: ['dashboard-counts', 'customer'], queryFn: ticketsApi.customerCounts });
  const { data, isLoading, error, refetch } = useTicketList({ scope: 'customer', pageSize: 5 });

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name ?? ''}`}
        subtitle="Track your support tickets and their progress"
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.customer.newTicket)}>
            New Ticket
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <StatCard key={c.key} label={c.label} value={c.count} tone={c.tone} />
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">Recently Updated Tickets</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.customer.tickets)}>
            View all
          </Button>
        </div>
        <TicketTable
          rows={data?.items ?? []}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onRowClick={(t) => navigate(ROUTES.customer.ticket(t.id))}
          variant="customer"
        />
      </Card>
    </div>
  );
}
