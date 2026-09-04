import { ArrowLeft, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import type { Ticket } from '@/types/ticket';
import { PriorityBadge, StatusBadge, DepartmentBadge } from './TicketBadges';
import { Badge } from '@/components/ui/Badge';

export function TicketHeader({ ticket, backTo }: { ticket: Ticket; backTo: string }) {
  const overdue = ticket.slaResolutionDueAt && isPast(new Date(ticket.slaResolutionDueAt)) && !ticket.resolvedAt && !ticket.closedAt;

  return (
    <div className="mb-4">
      <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to list
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-text-muted">{ticket.number}</span>
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <DepartmentBadge name={ticket.currentDepartmentName} />
            {ticket.isEscalated && (
              <Badge tone="danger" dot>
                <AlertTriangle className="h-3 w-3" /> Escalated
              </Badge>
            )}
            {overdue && (
              <Badge tone="danger" dot>
                <Clock className="h-3 w-3" /> Overdue
              </Badge>
            )}
          </div>
          <h1 className="mt-1.5 text-lg font-semibold text-text">{ticket.subject}</h1>
        </div>
        {ticket.slaResolutionDueAt && (
          <div className="text-right text-xs text-text-muted">
            <p>SLA resolution due</p>
            <p className={overdue ? 'font-medium text-danger-500' : 'font-medium text-text'}>
              {format(new Date(ticket.slaResolutionDueAt), 'MMM d, HH:mm')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
