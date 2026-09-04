import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FieldShell, Textarea } from '@/components/ui/Field';
import { departmentsApi } from '@/services/api/departmentsApi';
import type { AssignTicketPayload } from '@/types/ticket';

export function AssignDialog({
  open,
  onClose,
  departmentId,
  onSubmit,
  isSubmitting,
  preselectedEmployeeIds = [],
}: {
  open: boolean;
  onClose: () => void;
  departmentId: string;
  onSubmit: (payload: AssignTicketPayload) => Promise<unknown>;
  isSubmitting?: boolean;
  preselectedEmployeeIds?: string[];
}) {
  const { data: members = [] } = useQuery({
    queryKey: ['departments', departmentId, 'team'],
    queryFn: () => departmentsApi.teamMembers(departmentId),
    enabled: open,
  });
  const [mode, setMode] = useState<'specific' | 'team'>('specific');
  const [selected, setSelected] = useState<Set<string>>(new Set(preselectedEmployeeIds));
  const [comment, setComment] = useState('');

  // Reset the form fields whenever the dialog transitions from closed to open,
  // following React's "adjust state during render" pattern instead of an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelected(new Set(preselectedEmployeeIds));
      setMode('specific');
      setComment('');
    }
  }

  const canSubmit = mode === 'team' || selected.size > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Assign Ticket"
      description="Assign to one or more specific employees, or to the entire team. All selected people work on the same ticket."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isSubmitting}
            disabled={!canSubmit}
            onClick={async () => {
              await onSubmit({
                employeeIds: mode === 'team' ? [] : Array.from(selected),
                assignToEntireTeam: mode === 'team',
                comment: comment.trim() || undefined,
              });
              onClose();
            }}
          >
            Assign
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
          <input type="radio" name="assign-mode" checked={mode === 'specific'} onChange={() => setMode('specific')} />
          <span className="text-sm font-medium text-text">Specific Employees</span>
        </label>

        {mode === 'specific' && (
          <div className="ml-6 flex flex-col gap-1.5 rounded-md border border-border p-2">
            {members.length === 0 && <p className="px-1 py-1 text-xs text-text-muted">No employees in this department.</p>}
            {members
              .filter((m) => !m.isManager)
              .map((m) => (
                <label key={m.id} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-surface-sunken">
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(m.id);
                      else next.delete(m.id);
                      setSelected(next);
                    }}
                  />
                  <span className="text-sm text-text">{m.name}</span>
                  {m.jobTitle && <span className="text-xs text-text-faint">· {m.jobTitle}</span>}
                </label>
              ))}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
          <input type="radio" name="assign-mode" checked={mode === 'team'} onChange={() => setMode('team')} />
          <span className="text-sm font-medium text-text">Entire Team</span>
        </label>
        {mode === 'team' && (
          <p className="ml-6 text-xs text-text-muted">All team members will be able to see and work on this ticket.</p>
        )}

        <FieldShell label="Comment" hint="Optional note visible in the assignment history">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
        </FieldShell>
      </div>
    </Dialog>
  );
}
