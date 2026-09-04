import { TicketQueuePage } from '@/features/tickets/TicketQueuePage';
import { ticketsApi } from '@/services/api/ticketsApi';
import { ROUTES } from '@/constants/routes';

export default function CustomerCareDashboardPage() {
  return (
    <TicketQueuePage
      title="Customer Care"
      subtitle="Review incoming tickets and route them to the responsible department"
      countsQueryKey={['dashboard-counts', 'customer-care']}
      loadCounts={ticketsApi.customerCareCounts}
      countKeyToParams={(key) => {
        switch (key) {
          case 'new':
            return { statuses: ['New'] };
          case 'review':
            return { statuses: ['UnderReview'] };
          case 'waiting-to-forward':
            return { unrouted: true };
          case 'urgent':
            return { priorities: ['Urgent'] };
          case 'critical':
            return { priorities: ['Critical'] };
          case 'sla-at-risk':
            return { overdueOnly: true };
          default:
            return {};
        }
      }}
      baseParams={{}}
      ticketRoute={(id) => ROUTES.customerCare.ticket(id)}
      variant="internal"
    />
  );
}
