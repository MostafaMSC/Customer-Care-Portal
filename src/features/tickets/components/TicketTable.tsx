import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { DataTable, type Column } from '@/components/tables/DataTable';
import type { TicketListItem } from '@/types/ticket';
import { PriorityBadge, StatusBadge, SourceBadge, AssignmentSummary, DepartmentBadge } from './TicketBadges';

export function TicketTable({
  rows,
  isLoading,
  error,
  onRetry,
  onRowClick,
  variant = 'internal',
  emptyTitle,
  emptyDescription,
}: {
  rows: TicketListItem[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick: (row: TicketListItem) => void;
  variant?: 'customer' | 'internal' | 'manager';
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const columns: Column<TicketListItem>[] = [
    {
      header: 'Ticket #',
      cell: (t) => (
        <span className="flex items-center gap-1.5 font-medium text-text">
          {t.isEscalated && <AlertTriangle className="h-3.5 w-3.5 text-danger-500" />}
          {t.number}
        </span>
      ),
    },
    { header: 'Subject', cell: (t) => <span className="line-clamp-1 max-w-xs text-text">{t.subject}</span> },
  ];

  if (variant !== 'customer') {
    columns.push({ header: 'Customer', cell: (t) => <span className="text-text-muted">{t.customerName}</span> });
    columns.push({ header: 'Source', cell: (t) => <SourceBadge source={t.source} /> });
  }

  columns.push({ header: 'Priority', cell: (t) => <PriorityBadge priority={t.priority} /> });
  columns.push({ header: 'Status', cell: (t) => <StatusBadge status={t.status} /> });

  if (variant === 'internal') {
    columns.push({ header: 'Department', cell: (t) => <DepartmentBadge name={t.currentDepartmentName} /> });
  }
  if (variant === 'manager' || variant === 'internal') {
    columns.push({ header: 'Assigned To', cell: (t) => <AssignmentSummary assignmentType={t.assignmentType} assignedNames={t.assignedNames} /> });
  }

  columns.push({
    header: 'Updated',
    cell: (t) => <span className="text-text-muted">{format(new Date(t.updatedAt), 'MMM d, HH:mm')}</span>,
  });

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(t) => t.id}
      onRowClick={onRowClick}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle={emptyTitle ?? 'No tickets found'}
      emptyDescription={emptyDescription ?? 'Try adjusting your filters.'}
    />
  );
}
