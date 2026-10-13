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
          // `bucket` is what the real backend's department queue understands; the other fields drive the mock.
          case 'incoming':
            return { statuses: ['WaitingForDepartment'], bucket: 'incoming' };
          case 'unassigned':
            return { scope: 'department-unassigned', bucket: 'unassigned' };
          case 'assigned':
            return { statuses: ['Assigned'], bucket: 'assigned' };
          case 'in-progress':
            return { statuses: ['InProgress', 'Assigned'], bucket: 'inProgress' };
          case 'waiting':
            return { statuses: ['WaitingForCustomer', 'WaitingForDepartment'], bucket: 'waiting' };
          case 'overdue':
            return { overdueOnly: true, bucket: 'overdue' };
          case 'critical':
            return { criticalOnly: true, bucket: 'critical' };
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
