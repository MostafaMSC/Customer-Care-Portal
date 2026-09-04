import { Building2, Code2, Globe, Headset, Mail, Phone, PhoneCall, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ASSIGNMENT_TYPE_LABEL, PRIORITY_META, SOURCE_META, STATUS_META } from '@/constants/ticketMeta';
import { AssignmentType, type TicketPriority, type TicketSource, type TicketStatus } from '@/types/ticket';

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const meta = PRIORITY_META[priority];
  return <Badge tone={meta.tone} dot={priority === 'Critical' || priority === 'Urgent'}>{meta.label}</Badge>;
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

const SOURCE_ICONS = { phone: Phone, globe: Globe, headset: Headset, mail: Mail, code: Code2, 'phone-call': PhoneCall };

export function SourceBadge({ source }: { source: TicketSource }) {
  const meta = SOURCE_META[source];
  const Icon = SOURCE_ICONS[meta.icon as keyof typeof SOURCE_ICONS];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

export function AssignmentSummary({
  assignmentType,
  assignedNames,
}: {
  assignmentType?: AssignmentType;
  assignedNames: string[];
}) {
  if (!assignmentType) return <span className="text-xs text-text-faint">Unassigned</span>;
  if (assignmentType === AssignmentType.EntireDepartment) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-text">
        <Users className="h-3.5 w-3.5 text-text-faint" /> Entire Team
      </span>
    );
  }
  return <span className="text-xs text-text">{assignedNames.join(', ') || '—'}</span>;
}

export function DepartmentBadge({ name }: { name?: string }) {
  if (!name) return <span className="text-xs text-text-faint">Unrouted</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <Building2 className="h-3.5 w-3.5" /> {name}
    </span>
  );
}

export function AssignmentTypeBadge({ type }: { type: AssignmentType }) {
  return <Badge tone="neutral">{ASSIGNMENT_TYPE_LABEL[type]}</Badge>;
}
