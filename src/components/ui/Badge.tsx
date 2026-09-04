import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export type Tone = 'neutral' | 'info' | 'brand' | 'warning' | 'danger' | 'critical' | 'success';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-text-muted border-border',
  info: 'bg-info-50 text-info-500 border-transparent',
  brand: 'bg-brand-50 text-brand-600 border-transparent',
  warning: 'bg-warning-50 text-warning-600 border-transparent',
  danger: 'bg-danger-50 text-danger-600 border-transparent',
  critical: 'bg-danger-500 text-white border-transparent',
  success: 'bg-success-50 text-success-600 border-transparent',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium leading-5 whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
