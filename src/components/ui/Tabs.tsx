import { clsx } from 'clsx';

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border px-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'relative -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
            tab.value === value
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-text-muted hover:text-text',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={clsx(
                'rounded-full px-1.5 py-0.5 text-[11px] leading-none',
                tab.value === value ? 'bg-brand-50 text-brand-600' : 'bg-surface-sunken text-text-faint',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
