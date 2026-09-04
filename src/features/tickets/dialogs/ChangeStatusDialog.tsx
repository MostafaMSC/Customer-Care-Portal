import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FieldShell, Select, Textarea } from '@/components/ui/Field';
import { STATUS_META } from '@/constants/ticketMeta';
import { TicketStatus, type TicketStatus as TicketStatusType } from '@/types/ticket';

const SELECTABLE_STATUSES: TicketStatusType[] = [
  TicketStatus.InProgress,
  TicketStatus.WaitingForCustomer,
  TicketStatus.WaitingForDepartment,
  TicketStatus.Resolved,
  TicketStatus.Closed,
  TicketStatus.Reopened,
  TicketStatus.Cancelled,
];

export function ChangeStatusDialog({
  open,
  onClose,
  currentStatus,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  currentStatus: TicketStatusType;
  onSubmit: (status: TicketStatusType, note?: string) => Promise<unknown>;
  isSubmitting?: boolean;
}) {
  const [status, setStatus] = useState<TicketStatusType>(currentStatus);
  const [note, setNote] = useState('');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Change Status"
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isSubmitting}
            disabled={status === currentStatus}
            onClick={async () => {
              await onSubmit(status, note.trim() || undefined);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FieldShell label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as TicketStatusType)}>
            {SELECTABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </FieldShell>
        <FieldShell label="Note" hint="Optional, recorded in the timeline">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </FieldShell>
      </div>
    </Dialog>
  );
}
