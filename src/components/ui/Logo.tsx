import { clsx } from 'clsx';
import twokeyokIcon from '@/assets/twokeyok-icon-square.png';
import twokeyokLockup from '@/assets/twokeyok-logo-lockup.png';

/** Twokeyok brand mark, cropped/exported from the company's own logo file. */
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
  const wordmark = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <span className={clsx('flex shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-sm', iconBox)}>
        <img src={twokeyokIcon} alt="" className="h-full w-full object-cover" />
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

/** Full brand lockup (icon + Arabic + "Twokeyok" wordmark) as shipped by the company - for hero/marketing placements. */
export function LogoLockup({ className }: { className?: string }) {
  return <img src={twokeyokLockup} alt="Twokeyok" className={clsx('h-auto w-48', className)} />;
}
