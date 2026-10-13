import { TicketQueuePage } from '@/features/tickets/TicketQueuePage';
import { ticketsApi } from '@/services/api/ticketsApi';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

export default function EmployeeDashboardPage() {
  const user = useAuthStore((s) => s.user)!;
  return (
    <TicketQueuePage
      title="My Work"
      subtitle="Tickets assigned to you individually, with others, or to your entire team"
      countsQueryKey={['dashboard-counts', 'employee', user.id]}
      loadCounts={() => ticketsApi.employeeCounts(user.id)}
      countKeyToParams={(key) => {
        switch (key) {
          // `bucket` is what the real backend's personal queue understands; the other fields drive the mock.
          case 'my-tickets':
            return { scope: 'mine', bucket: 'assigned' };
          case 'team-tickets':
            return { scope: 'team', bucket: 'team' };
          case 'urgent':
            return { scope: 'mine', priorities: ['Urgent', 'Critical'] };
          case 'in-progress':
            return { scope: 'mine', statuses: ['InProgress'], bucket: 'inProgress' };
          case 'overdue':
            return { scope: 'mine', overdueOnly: true, bucket: 'overdue' };
          case 'waiting':
            return { scope: 'mine', statuses: ['WaitingForCustomer', 'WaitingForDepartment'], bucket: 'waiting' };
          default:
            return {};
        }
      }}
      baseParams={{ scope: 'mine' }}
      ticketRoute={(id) => ROUTES.employee.ticket(id)}
      variant="internal"
    />
  );
}
