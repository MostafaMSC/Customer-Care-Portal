import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TicketQueuePage } from '@/features/tickets/TicketQueuePage';
import { ticketsApi } from '@/services/api/ticketsApi';
import { ROUTES } from '@/constants/routes';

export default function CustomerCareTicketsPage() {
  const navigate = useNavigate();
  return (
    <TicketQueuePage
      title="Tickets"
      subtitle="All tickets across every source and department"
      actions={
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.customerCare.newTicket)}>
          New Ticket
        </Button>
      }
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
