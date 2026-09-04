import { TicketQueuePage } from '@/features/tickets/TicketQueuePage';
import { ticketsApi } from '@/services/api/ticketsApi';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

export default function ManagerDashboardPage() {
  const user = useAuthStore((s) => s.user)!;
  const departmentId = user.departmentId!;

  return (
    <TicketQueuePage
      title={`${user.departmentName} Department`}
      subtitle="Tickets currently owned by your department"
      countsQueryKey={['dashboard-counts', 'manager', departmentId]}
      loadCounts={() => ticketsApi.managerCounts(departmentId)}
      countKeyToParams={(key) => {
        switch (key) {
          case 'incoming':
            return { statuses: ['WaitingForDepartment'] };
          case 'unassigned':
            return { scope: 'department-unassigned' };
          case 'in-progress':
            return { statuses: ['InProgress', 'Assigned'] };
          case 'waiting':
            return { statuses: ['WaitingForCustomer', 'WaitingForDepartment'] };
          case 'overdue':
            return { overdueOnly: true };
          case 'critical':
            return { criticalOnly: true };
          default:
            return {};
        }
      }}
      baseParams={{ scope: 'department-queue', departmentId }}
      ticketRoute={(id) => ROUTES.manager.ticket(id)}
      variant="manager"
    />
  );
}
