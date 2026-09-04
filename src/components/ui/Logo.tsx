import { ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Twokeyok brand lockup. This is a placeholder built from the brand's teal
 * palette and a stand-in mark (ShieldCheck) - swap the icon markup below for
 * the real logo asset (SVG/PNG) once it's available; every consumer of this
 * component picks the change up automatically.
 */
export function Logo({
  subtitle,
  size = 'md',
  onDark = false,
  className,
}: {
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
  className?: string;
}) {
  const iconBox = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const iconGlyph = size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const wordmark = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <span
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-lg text-white shadow-sm',
          iconBox,
          onDark ? 'bg-white/15 ring-1 ring-white/30' : 'brand-hero-gradient',
        )}
      >
        <ShieldCheck className={iconGlyph} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className={clsx('font-semibold tracking-tight', wordmark, onDark ? 'text-white' : 'text-text')}>
          Twokeyok
        </span>
        {subtitle && (
          <span className={clsx('text-[10px] font-medium uppercase tracking-wider', onDark ? 'text-white/70' : 'text-text-faint')}>
            {subtitle}
          </span>
        )}
      </span>
    </div>
  );
}
