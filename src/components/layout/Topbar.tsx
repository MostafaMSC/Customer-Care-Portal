import { Search, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationBell } from '@/features/notifications/NotificationBell';

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-surface-subtle px-3 py-1.5">
        <Search className="h-4 w-4 text-text-faint" />
        <input
          type="search"
          placeholder="Search tickets, customers…"
          className="w-full bg-transparent text-sm text-text placeholder:text-text-faint focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-sunken"
          >
            {user && <Avatar name={user.name} size="sm" />}
            <span className="hidden text-sm font-medium text-text sm:block">{user?.name}</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-border bg-surface py-1 shadow-xl">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-medium text-text">{user?.name}</p>
                  <p className="text-xs text-text-muted">{user?.role}{user?.departmentName ? ` · ${user.departmentName}` : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-500 hover:bg-surface-sunken"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
