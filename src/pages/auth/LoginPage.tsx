import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Headset } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldShell, Input } from '@/components/ui/Field';
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
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Headset className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-text">Customer Care Portal</h1>
          <p className="text-sm text-text-muted">Sign in to manage tickets and departments</p>
        </div>

        <form
          onSubmit={handleSubmit((values) => login({ username: values.username, password: values.password }))}
          className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6"
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
