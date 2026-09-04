import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FieldShell, Select, Textarea } from '@/components/ui/Field';
import { departmentsApi } from '@/services/api/departmentsApi';
import type { RequestAssistancePayload } from '@/types/ticket';

export function RequestAssistanceDialog({
  open,
  onClose,
  currentDepartmentId,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  currentDepartmentId?: string;
  onSubmit: (payload: RequestAssistancePayload) => Promise<unknown>;
  isSubmitting?: boolean;
}) {
  const { data: departments = [] } = useQuery({ queryKey: ['departments', 'routable'], queryFn: departmentsApi.listRoutable, enabled: open });
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [reason, setReason] = useState('');

  const options = departments.filter((d) => d.id !== currentDepartmentId);
  const canSubmit = !!targetDepartmentId && reason.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Request Assistance"
      description="Your department keeps ownership of this ticket. The target department only provides input."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isSubmitting}
            disabled={!canSubmit}
            onClick={async () => {
              await onSubmit({ targetDepartmentId, reason: reason.trim() });
              onClose();
            }}
          >
            Request Assistance
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldShell label="Need assistance from" required>
          <Select value={targetDepartmentId} onChange={(e) => setTargetDepartmentId(e.target.value)}>
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
