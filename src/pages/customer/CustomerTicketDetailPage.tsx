import { useParams } from 'react-router-dom';
import { CustomerTicketDetailView } from '@/features/tickets/CustomerTicketDetailView';

export default function CustomerTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <CustomerTicketDetailView ticketId={id} />;
}
