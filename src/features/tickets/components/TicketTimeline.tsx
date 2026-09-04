import { format } from 'date-fns';
import {
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Flag,
  Handshake,
  Lock,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { TimelineEventType, type TimelineEvent } from '@/types/ticket';

const ICONS: Record<string, typeof Building2> = {
  [TimelineEventType.Created]: MessageSquare,
  [TimelineEventType.Forwarded]: ArrowRightLeft,
  [TimelineEventType.DepartmentReceived]: Building2,
  [TimelineEventType.Assigned]: UserPlus,
  [TimelineEventType.AssignmentChanged]: UserPlus,
  [TimelineEventType.Unassigned]: XCircle,
  [TimelineEventType.Transferred]: ArrowRightLeft,
  [TimelineEventType.CollaborationRequested]: Handshake,
  [TimelineEventType.CollaborationResponded]: Handshake,
  [TimelineEventType.StatusChanged]: Flag,
  [TimelineEventType.PriorityChanged]: Flag,
  [TimelineEventType.CommentAdded]: MessageSquare,
  [TimelineEventType.InternalNoteAdded]: Lock,
  [TimelineEventType.CustomerResponded]: MessageSquare,
  [TimelineEventType.Escalated]: ShieldAlert,
  [TimelineEventType.Resolved]: CheckCircle2,
  [TimelineEventType.Closed]: CheckCircle2,
  [TimelineEventType.Reopened]: RotateCcw,
};

export function TicketTimeline({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  return (
    <Card>
      <CardHeader title="Ticket Timeline" subtitle="Complete, append-only history of this ticket" />
      <ol className="flex flex-col gap-0 p-4">
        {sorted.map((e, idx) => {
          const Icon = ICONS[e.type] ?? MessageSquare;
          return (
            <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
              {idx < sorted.length - 1 && <span className="absolute left-[13px] top-6 h-full w-px bg-border" />}
              <span className="z-10 flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                <Icon className="h-3.5 w-3.5 text-text-muted" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm text-text">
                  {e.summary} <span className="text-text-faint">— {e.actorName}</span>
                </p>
                {e.detail && <p className="mt-0.5 text-xs text-text-muted">{e.detail}</p>}
                <p className="mt-0.5 text-[11px] text-text-faint">{format(new Date(e.occurredAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
