import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TicketQueuePage } from '@/features/tickets/TicketQueuePage';
import { ticketsApi } from '@/services/api/ticketsApi';
import { ROUTES } from '@/constants/routes';

export default function CustomerTicketsPage() {
  const navigate = useNavigate();
  return (
    <TicketQueuePage
      title="My Tickets"
      subtitle="All tickets you have submitted"
      actions={
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate(ROUTES.customer.newTicket)}>
          New Ticket
        </Button>
      }
      countsQueryKey={['dashboard-counts', 'customer']}
      loadCounts={ticketsApi.customerCounts}
      countKeyToParams={(key) => {
        switch (key) {
          case 'open':
            return { excludeStatuses: ['Resolved', 'Closed', 'Cancelled'] };
          case 'waiting-for-me':
            return { statuses: ['WaitingForCustomer'] };
          case 'resolved':
            return { statuses: ['Resolved'] };
          case 'closed':
            return { statuses: ['Closed'] };
          default:
            return {};
        }
      }}
      baseParams={{ scope: 'customer' }}
      ticketRoute={(id) => ROUTES.customer.ticket(id)}
      variant="customer"
    />
  );
}
