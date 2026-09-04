import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { ROLE_HOME } from '@/constants/nav';

export default function NotFoundPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface-sunken px-4 text-center">
      <FileQuestion className="h-10 w-10 text-text-faint" />
      <h1 className="text-lg font-semibold text-text">404 — Page not found</h1>
      <p className="max-w-sm text-sm text-text-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to={user ? ROLE_HOME[user.role] : '/login'}>
        <Button variant="outline">Back to my dashboard</Button>
      </Link>
    </div>
  );
}
