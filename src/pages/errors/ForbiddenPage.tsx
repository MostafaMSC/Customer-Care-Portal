import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { ROLE_HOME } from '@/constants/nav';

export default function ForbiddenPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-sunken px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-danger-500" />
      <h1 className="text-lg font-semibold text-text">403 — Access Denied</h1>
      <p className="max-w-sm text-sm text-text-muted">You do not have permission to view this page.</p>
      <Link to={user ? ROLE_HOME[user.role] : '/login'}>
        <Button variant="outline">Back to my dashboard</Button>
      </Link>
    </div>
  );
}
