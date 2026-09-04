import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FieldShell, Textarea } from '@/components/ui/Field';

export function EscalateDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason?: string) => Promise<unknown>;
  isSubmitting?: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Escalate Ticket"
      description="Escalation is recorded permanently in the ticket history and highlighted to management."
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={isSubmitting}
            onClick={async () => {
              await onSubmit(reason.trim() || undefined);
              onClose();
              setReason('');
            }}
          >
            Escalate
          </Button>
        </>
      }
    >
      <FieldShell label="Reason" hint="Optional">
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
      </FieldShell>
    </Dialog>
  );
}
