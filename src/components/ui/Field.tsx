import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { clsx } from 'clsx';

const baseFieldClasses =
  'w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text ' +
  'placeholder:text-text-faint focus:outline-2 focus:outline-offset-1 focus:outline-brand-500 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-sunken';

export function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-text-muted">
          {label}
          {required && <span className="text-danger-500"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(baseFieldClasses, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(baseFieldClasses, 'min-h-24 resize-y', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(baseFieldClasses, 'appearance-none bg-no-repeat', className)} {...rest}>
      {children}
    </select>
  );
}
