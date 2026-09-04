import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FieldShell, Select, Textarea } from '@/components/ui/Field';
import { departmentsApi } from '@/services/api/departmentsApi';
import type { TransferTicketPayload } from '@/types/ticket';

export function TransferDialog({
  open,
  onClose,
  currentDepartmentId,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  currentDepartmentId?: string;
  onSubmit: (payload: TransferTicketPayload) => Promise<unknown>;
  isSubmitting?: boolean;
}) {
  const { data: departments = [] } = useQuery({ queryKey: ['departments', 'routable'], queryFn: departmentsApi.listRoutable, enabled: open });
  const [toDepartmentId, setToDepartmentId] = useState('');
  const [reason, setReason] = useState('');

  const options = departments.filter((d) => d.id !== currentDepartmentId);
  const canSubmit = !!toDepartmentId && reason.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Transfer Department"
      description="The destination department becomes fully responsible for this ticket. Current employee assignments will be cleared and the new manager must assign it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={isSubmitting}
            disabled={!canSubmit}
            onClick={async () => {
              await onSubmit({ toDepartmentId, reason: reason.trim() });
              onClose();
            }}
          >
            Transfer
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label="Transfer To" required>
          <Select value={toDepartmentId} onChange={(e) => setToDepartmentId(e.target.value)}>
            <option value="">Select a department…</option>
            {options.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </FieldShell>
        <FieldShell label="Reason" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </FieldShell>
      </div>
    </Dialog>
  );
}
