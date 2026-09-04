import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FieldShell, Textarea } from '@/components/ui/Field';
import type { CollaborationRequest, RespondAssistancePayload } from '@/types/ticket';

export function RespondAssistanceDialog({
  open,
  onClose,
  request,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  request: CollaborationRequest | null;
  onSubmit: (payload: RespondAssistancePayload) => Promise<unknown>;
  isSubmitting?: boolean;
}) {
  const [response, setResponse] = useState('');
  const [markCompleted, setMarkCompleted] = useState(true);

  if (!request) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Respond to ${request.requestingDepartmentName}`}
      description={request.reason}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={isSubmitting}
            disabled={!response.trim()}
            onClick={async () => {
              await onSubmit({ requestId: request.id, response: response.trim(), markCompleted });
              onClose();
              setResponse('');
            }}
          >
            Send Response
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FieldShell label="Response" required>
          <Textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3} />
        </FieldShell>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={markCompleted} onChange={(e) => setMarkCompleted(e.target.checked)} className="h-4 w-4 rounded border-border-strong" />
          Mark this request as completed
        </label>
      </div>
    </Dialog>
  );
}
