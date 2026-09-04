import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { notificationsApi } from '@/services/api/notificationsApi';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

function ticketRouteFor(role: string, id: string): string {
  switch (role) {
    case 'CustomerCare':
      return ROUTES.customerCare.ticket(id);
    case 'Manager':
      return ROUTES.manager.ticket(id);
    case 'Employee':
      return ROUTES.employee.ticket(id);
    case 'Customer':
      return ROUTES.customer.ticket(id);
    default:
      return ROUTES.management.root;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 20_000,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        className="relative rounded-md p-2 text-text-muted hover:bg-surface-sunken hover:text-text"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-danger-500 px-0.5 text-[9px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface shadow-xl">
            <div className="border-b border-border px-3 py-2 text-sm font-semibold text-text">Notifications</div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyState title="No notifications" description="You're all caught up." />
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={async () => {
                      await notificationsApi.markRead(n.id);
                      queryClient.invalidateQueries({ queryKey: ['notifications'] });
                      setOpen(false);
                      if (n.ticketId && user) navigate(ticketRouteFor(user.role, n.ticketId));
                    }}
                    className={clsx(
                      'flex w-full flex-col gap-0.5 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-surface-sunken',
                      !n.readAt && 'bg-brand-50/40',
                    )}
                  >
                    <span className="text-sm text-text">{n.title}</span>
                    <span className="text-xs text-text-muted">{n.message}</span>
                    <span className="text-[11px] text-text-faint">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
