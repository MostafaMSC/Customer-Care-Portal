import { CheckCircle2 } from 'lucide-react';
import { useTicketDetail } from './hooks/useTicketDetail';
import { useTicketActions } from './hooks/useTicketActions';
import { TicketHeader } from './components/TicketHeader';
import { TicketInfoGrid } from './components/TicketInfoGrid';
import { TicketConversation } from './components/TicketConversation';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { TicketStatus } from '@/types/ticket';
import { ROUTES } from '@/constants/routes';

export function CustomerTicketDetailView({ ticketId }: { ticketId: string }) {
  const { data: ticket, isLoading, error, refetch } = useTicketDetail(ticketId);
  const actions = useTicketActions(ticketId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error || !ticket) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div>
      <TicketHeader ticket={ticket} backTo={ROUTES.customer.tickets} />

      {ticket.status === TicketStatus.Resolved && (
        <Card className="mb-4 border-success-500/30 bg-success-50">
          <CardBody className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-success-600">
              <CheckCircle2 className="h-4 w-4" /> This ticket has been marked resolved. Please confirm if your issue is fixed.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => actions.changeStatus(TicketStatus.Reopened, 'Customer reported the issue is not resolved')}>
                Not resolved
              </Button>
              <Button size="sm" onClick={() => actions.changeStatus(TicketStatus.Closed, 'Customer confirmed resolution')}>
                Confirm resolved
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        <TicketInfoGrid ticket={ticket} />
        <TicketConversation
          comments={ticket.comments}
          canAddInternalNote={false}
          canRespond
          isSubmitting={actions.isBusy}
          onSubmit={(message) => actions.addComment(message, 'Customer')}
        />
      </div>
    </div>
  );
}
