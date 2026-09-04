import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FieldShell, Select } from '@/components/ui/Field';
import { PRIORITY_ORDER } from '@/constants/ticketMeta';
import { PRIORITY_META } from '@/constants/ticketMeta';
import type { TicketPriority } from '@/types/ticket';

export function ChangePriorityDialog({
  open,
  onClose,
  currentPriority,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  currentPriority: TicketPriority;
  onSubmit: (priority: TicketPriority) => Promise<unknown>;
  isSubmitting?: boolean;
}) {
  const [priority, setPriority] = useState<TicketPriority>(currentPriority);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Change Priority"
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isSubmitting}
            disabled={priority === currentPriority}
            onClick={async () => {
              await onSubmit(priority);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <FieldShell label="Priority">
        <Select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </Select>
      </FieldShell>
    </Dialog>
  );
}
