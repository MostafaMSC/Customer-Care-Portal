import { useParams } from 'react-router-dom';
import { TicketDetailView } from '@/features/tickets/TicketDetailView';
import { ROUTES } from '@/constants/routes';

export default function CustomerCareTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <TicketDetailView ticketId={id} backTo={ROUTES.customerCare.tickets} />;
}
