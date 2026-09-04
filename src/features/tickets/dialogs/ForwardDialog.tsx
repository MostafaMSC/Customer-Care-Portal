import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FieldShell, Select, Textarea } from '@/components/ui/Field';
import { departmentsApi } from '@/services/api/departmentsApi';
import type { ForwardTicketPayload } from '@/types/ticket';

export function ForwardDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ForwardTicketPayload) => Promise<unknown>;
  isSubmitting?: boolean;
}) {
  const { data: departments = [] } = useQuery({ queryKey: ['departments', 'routable'], queryFn: departmentsApi.listRoutable, enabled: open });
  const [departmentId, setDepartmentId] = useState('');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  const canSubmit = !!departmentId && reason.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Forward Ticket"
      description="Choose the responsible department. You will not select an individual employee - the department manager assigns the ticket from their incoming queue."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isSubmitting}
            disabled={!canSubmit}
            onClick={async () => {
              await onSubmit({ departmentId, reason: reason.trim(), comment: comment.trim() || undefined });
              onClose();
            }}
          >
            Forward
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label="Responsible Department" required>
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FieldShell>
        <FieldShell label="Forwarding Reason" required hint="Why is this the responsible department?">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </FieldShell>
        <FieldShell label="Comment" hint="Optional note for the department manager">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
        </FieldShell>
      </div>
    </Dialog>
  );
}
