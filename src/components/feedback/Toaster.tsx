import { useEffect } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useUiStore } from '@/store/uiStore';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TONE_CLASSES = {
  success: 'border-success-500/30 text-success-600',
  error: 'border-danger-500/30 text-danger-600',
  info: 'border-brand-500/30 text-brand-600',
};

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismissToast(t.id), 5000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className={clsx('flex items-start gap-2 rounded-md border bg-surface px-3 py-2.5 shadow-lg', TONE_CLASSES[t.tone])}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm text-text">{t.message}</p>
          </div>
        );
      })}
    </div>
  );
}
