import { useState } from 'react';
import { format } from 'date-fns';
import { Lock, Send } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import type { TicketComment } from '@/types/ticket';

export function TicketConversation({
  comments,
  canAddInternalNote,
  canRespond,
  onSubmit,
  isSubmitting,
}: {
  comments: TicketComment[];
  canAddInternalNote: boolean;
  canRespond: boolean;
  onSubmit: (message: string, visibility: 'Customer' | 'Internal') => Promise<unknown>;
  isSubmitting?: boolean;
}) {
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState<'Customer' | 'Internal'>('Customer');

  const canPost = canAddInternalNote || canRespond;

  return (
    <Card>
      <CardHeader title="Conversation" subtitle="Customer messages and internal notes for this ticket" />
      <div className="flex flex-col gap-4 p-4">
        {comments.length === 0 && <p className="text-sm text-text-muted">No messages yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className={clsx('flex gap-3', c.visibility === 'Internal' && 'rounded-md bg-warning-50 p-3')}>
            <Avatar name={c.authorName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-text">{c.authorName}</span>
                <span className="text-xs text-text-faint">{c.authorRole}</span>
                {c.visibility === 'Internal' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning-600">
                    <Lock className="h-3 w-3" /> Internal note
                  </span>
                )}
                <span className="text-xs text-text-faint">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text">{c.message}</p>
            </div>
          </div>
        ))}

        {canPost && (
          <div className="border-t border-border pt-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={visibility === 'Internal' ? 'Write an internal note (not visible to the customer)…' : 'Write a response to the customer…'}
              rows={3}
            />
            <div className="mt-2 flex items-center justify-between">
              {canAddInternalNote ? (
                <div className="flex gap-1 rounded-md bg-surface-sunken p-0.5">
                  {(['Customer', 'Internal'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibility(v)}
                      className={clsx(
                        'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                        visibility === v ? 'bg-surface text-text shadow-sm' : 'text-text-muted',
                      )}
                    >
                      {v === 'Customer' ? 'Customer Response' : 'Internal Note'}
                    </button>
                  ))}
                </div>
              ) : (
                <span />
              )}
              <Button
                size="sm"
                icon={<Send className="h-3.5 w-3.5" />}
                loading={isSubmitting}
                disabled={!message.trim()}
                onClick={async () => {
                  await onSubmit(message.trim(), canAddInternalNote ? visibility : 'Customer');
                  setMessage('');
                }}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
