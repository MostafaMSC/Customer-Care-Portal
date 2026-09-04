import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Building2,
  Headset,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  PhoneCall,
  ShieldCheck,
  Ticket,
  Users,
  UserSquare2,
} from 'lucide-react';
import { AppRole } from '@/types/domain';
import { ROUTES } from '@/constants/routes';

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<LucideProps>;
}

export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  [AppRole.Customer]: [
    { label: 'Dashboard', to: ROUTES.customer.root, icon: LayoutDashboard },
    { label: 'My Tickets', to: ROUTES.customer.tickets, icon: Ticket },
    { label: 'Profile', to: ROUTES.customer.profile, icon: UserSquare2 },
  ],
  [AppRole.CustomerCare]: [
    { label: 'Dashboard', to: ROUTES.customerCare.root, icon: LayoutDashboard },
    { label: 'Tickets', to: ROUTES.customerCare.tickets, icon: Headset },
  ],
  [AppRole.Employee]: [
    { label: 'Dashboard', to: ROUTES.employee.root, icon: LayoutDashboard },
    { label: 'My Work', to: ROUTES.employee.tickets, icon: ListChecks },
  ],
  [AppRole.Manager]: [
    { label: 'Dashboard', to: ROUTES.manager.root, icon: LayoutDashboard },
    { label: 'Incoming Queue', to: ROUTES.manager.incoming, icon: PhoneCall },
    { label: 'Department Tickets', to: ROUTES.manager.tickets, icon: Ticket },
    { label: 'My Team', to: ROUTES.manager.team, icon: Users },
  ],
  [AppRole.Management]: [
    { label: 'Dashboard', to: ROUTES.management.root, icon: LayoutDashboard },
    { label: 'Reports', to: ROUTES.management.reports, icon: LifeBuoy },
    { label: 'Departments', to: ROUTES.management.departments, icon: Building2 },
    { label: 'Employees', to: ROUTES.management.employees, icon: Users },
  ],
  [AppRole.Administrator]: [
    { label: 'Management', to: ROUTES.management.root, icon: LayoutDashboard },
    { label: 'Reports', to: ROUTES.management.reports, icon: LifeBuoy },
    { label: 'Departments', to: ROUTES.management.departments, icon: Building2 },
    { label: 'Users', to: ROUTES.admin.users, icon: ShieldCheck },
  ],
};

export const ROLE_HOME: Record<AppRole, string> = {
  [AppRole.Customer]: ROUTES.customer.root,
  [AppRole.CustomerCare]: ROUTES.customerCare.root,
  [AppRole.Employee]: ROUTES.employee.root,
  [AppRole.Manager]: ROUTES.manager.root,
  [AppRole.Management]: ROUTES.management.root,
  [AppRole.Administrator]: ROUTES.management.root,
};
