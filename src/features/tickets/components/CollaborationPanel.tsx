import { format } from 'date-fns';
import { Handshake } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { CollaborationRequest } from '@/types/ticket';
import { CollaborationStatus } from '@/types/ticket';

const STATUS_TONE = {
  [CollaborationStatus.Pending]: 'warning',
  [CollaborationStatus.Responded]: 'brand',
  [CollaborationStatus.Completed]: 'success',
  [CollaborationStatus.Declined]: 'danger',
} as const;

export function CollaborationPanel({
  requests,
  canRequest,
  canRespond,
  currentUserDepartmentId,
  onRequestClick,
  onRespondClick,
}: {
  requests: CollaborationRequest[];
  canRequest: boolean;
  canRespond: boolean;
  currentUserDepartmentId?: string;
  onRequestClick: () => void;
  onRespondClick: (request: CollaborationRequest) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Department Assistance"
        subtitle="Cross-department collaboration - ownership of the ticket does not change"
        actions={
          canRequest && (
            <Button size="sm" variant="outline" onClick={onRequestClick}>
              Request Assistance
            </Button>
          )
        }
      />
      <CardBody className="flex flex-col gap-3">
        {requests.length === 0 && <p className="text-sm text-text-muted">No assistance has been requested for this ticket.</p>}
        {requests.map((r) => (
          <div key={r.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-text">
                <Handshake className="h-4 w-4 text-text-faint" /> {r.targetDepartmentName}
              </span>
              <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Requested by {r.requestedByUserName} · {format(new Date(r.requestedAt), 'MMM d, HH:mm')}
            </p>
            <p className="mt-1.5 text-sm text-text">{r.reason}</p>
            {r.response && <p className="mt-2 rounded bg-surface-sunken p-2 text-sm text-text">{r.response}</p>}
            {canRespond && r.status === CollaborationStatus.Pending && r.targetDepartmentId === currentUserDepartmentId && (
              <Button size="sm" variant="outline" className="mt-2" onClick={() => onRespondClick(r)}>
                Respond
              </Button>
            )}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
