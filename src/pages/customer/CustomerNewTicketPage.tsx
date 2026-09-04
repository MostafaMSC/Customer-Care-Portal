import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { TicketCreateForm } from '@/features/tickets/TicketCreateForm';
import { ROUTES } from '@/constants/routes';

export default function CustomerNewTicketPage() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="New Ticket" subtitle="Tell us what's going on and we'll route it to the right team" />
      <div className="max-w-2xl">
        <TicketCreateForm context="customer" onCreated={(id) => navigate(ROUTES.customer.ticket(id))} />
      </div>
    </div>
  );
}
