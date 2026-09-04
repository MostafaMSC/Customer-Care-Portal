import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/types/api';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof ApiError ? error.message : 'Something went wrong.';
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <AlertTriangle className="h-8 w-8 text-danger-500" />
      <p className="text-sm font-medium text-text">Unable to load data</p>
      <p className="max-w-sm text-xs text-text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={<RotateCw className="h-3.5 w-3.5" />} onClick={onRetry} className="mt-2">
          Retry
        </Button>
      )}
    </div>
  );
}
