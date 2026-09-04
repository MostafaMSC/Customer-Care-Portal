import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { NAV_BY_ROLE } from '@/constants/nav';
import { useAuthStore } from '@/store/authStore';
import { Logo } from '@/components/ui/Logo';

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const items = user ? NAV_BY_ROLE[user.role] : [];

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Logo subtitle="Customer Care" size="sm" />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-600' : 'text-text-muted hover:bg-surface-sunken hover:text-text',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
