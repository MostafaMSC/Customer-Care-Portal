import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketCreateForm } from '@/features/tickets/TicketCreateForm';
import { ROUTES } from '@/constants/routes';

export default function CustomerCareNewTicketPage() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="New Ticket" subtitle="Log a ticket on behalf of a customer (phone call, email, or walk-in)" />
      <div className="max-w-2xl">
        <TicketCreateForm context="customer-care" onCreated={(id) => navigate(ROUTES.customerCare.ticket(id))} />
      </div>
    </div>
  );
}
