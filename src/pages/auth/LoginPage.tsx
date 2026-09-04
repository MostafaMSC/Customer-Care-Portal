import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FieldShell, Input } from '@/components/ui/Field';
import { LogoLockup } from '@/components/ui/Logo';
import { useAuth } from '@/hooks/useAuth';
import { isRealMode } from '@/services/api/mode';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { username: '', password: '', rememberMe: true } });

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken px-4">
      <div className="w-full max-w-sm">
        <div className="brand-hero-gradient mb-0 flex flex-col items-center gap-3 rounded-t-lg px-6 py-8 text-center">
          <LogoLockup className="w-40" />
          <div>
            <h1 className="text-lg font-semibold text-white">Customer Care Portal</h1>
            <p className="mt-1 text-sm text-white/75">Sign in to manage tickets and departments</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((values) => login({ username: values.username, password: values.password }))}
          className="flex flex-col gap-4 rounded-b-lg border border-t-0 border-border bg-surface p-6"
          noValidate
        >
          <FieldShell label="Username or email" htmlFor="username" error={errors.username?.message} required>
            <Input id="username" autoComplete="username" autoFocus {...register('username')} />
          </FieldShell>
          <FieldShell label="Password" htmlFor="password" error={errors.password?.message} required>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          </FieldShell>

          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input type="checkbox" className="h-4 w-4 rounded border-border-strong" {...register('rememberMe')} />
            Remember me
          </label>

          <Button type="submit" loading={isLoggingIn} className="w-full">
            Sign in
          </Button>

          {!isRealMode && (
            <p className="rounded-md bg-surface-sunken px-3 py-2 text-xs text-text-muted">
              Demo mode: try <code className="text-text">layla</code> (Network Manager), <code className="text-text">sara</code>{' '}
              (Customer Care), <code className="text-text">ahmed</code> (Employee), <code className="text-text">mustafa</code>{' '}
              (Customer) or <code className="text-text">nadia</code> (Management) with password{' '}
              <code className="text-text">password123</code>.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
