import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { clsx } from 'clsx';
import type { Tone } from '@/components/ui/Badge';

const TONE_RING: Record<Tone, string> = {
  neutral: 'text-text-muted',
  info: 'text-info-500',
  brand: 'text-brand-500',
  warning: 'text-warning-500',
  danger: 'text-danger-500',
  critical: 'text-danger-500',
  success: 'text-success-500',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  onClick,
  active,
}: {
  label: string;
  value: number | string;
  icon?: ComponentType<LucideProps>;
  tone?: Tone;
  onClick?: () => void;
  active?: boolean;
}) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={clsx(
        'flex flex-col gap-2 rounded-lg border bg-surface px-4 py-3 text-left transition-colors',
        active ? 'border-brand-500 ring-1 ring-brand-500' : 'border-border',
        onClick && 'hover:border-border-strong',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {Icon && <Icon className={clsx('h-4 w-4', TONE_RING[tone])} />}
      </div>
      <span className="text-2xl font-semibold text-text">{value}</span>
    </Component>
  );
}
