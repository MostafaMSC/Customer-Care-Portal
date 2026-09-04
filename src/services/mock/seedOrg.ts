import { AppRole, type Customer, type Department, type Permission, type User } from '@/types/domain';
import { ROLE_PERMISSIONS } from '@/constants/permissions';
import { iso } from './helpers';

function user(partial: Omit<User, 'permissions'>): User {
  return { ...partial, permissions: ROLE_PERMISSIONS[partial.role] };
}

export const departments: Department[] = [
  { id: 'dept-cc', name: 'Customer Care', description: 'First point of contact and routing', managerId: 'user-omar', employeeCount: 2 },
  { id: 'dept-network', name: 'Network', description: 'Connectivity, VPN, LAN/WAN', managerId: 'user-layla', employeeCount: 4 },
  { id: 'dept-infra', name: 'Infrastructure', description: 'Servers, storage, data center', managerId: 'user-zainab', employeeCount: 2 },
  { id: 'dept-it', name: 'IT Support', description: 'Desktop, hardware, software', managerId: 'user-tariq', employeeCount: 1 },
  { id: 'dept-finance', name: 'Finance', description: 'Billing and invoicing', managerId: 'user-yousif', employeeCount: 1 },
  { id: 'dept-hr', name: 'Human Resources', description: 'Employee-related administration', managerId: 'user-rasha', employeeCount: 1 },
];

export const users: User[] = [
  user({ id: 'user-sara', name: 'Sara Ibrahim', username: 'sara', email: 'sara.ibrahim@company.com', role: AppRole.CustomerCare, departmentId: 'dept-cc', departmentName: 'Customer Care', jobTitle: 'Customer Care Agent' }),
  user({ id: 'user-omar', name: 'Omar Al-Tikriti', username: 'omar', email: 'omar.altikriti@company.com', role: AppRole.CustomerCare, departmentId: 'dept-cc', departmentName: 'Customer Care', jobTitle: 'Customer Care Lead' }),

  user({ id: 'user-layla', name: 'Layla Hassan', username: 'layla', email: 'layla.hassan@company.com', role: AppRole.Manager, departmentId: 'dept-network', departmentName: 'Network', jobTitle: 'Network Manager' }),
  user({ id: 'user-ahmed', name: 'Ahmed Yousef', username: 'ahmed', email: 'ahmed.yousef@company.com', role: AppRole.Employee, departmentId: 'dept-network', departmentName: 'Network', jobTitle: 'Network Engineer' }),
  user({ id: 'user-mohammed', name: 'Mohammed Kareem', username: 'mohammed', email: 'mohammed.kareem@company.com', role: AppRole.Employee, departmentId: 'dept-network', departmentName: 'Network', jobTitle: 'Network Engineer' }),
  user({ id: 'user-ali', name: 'Ali Jabbar', username: 'ali', email: 'ali.jabbar@company.com', role: AppRole.Employee, departmentId: 'dept-network', departmentName: 'Network', jobTitle: 'Network Technician' }),
  user({ id: 'user-hassan', name: 'Hassan Fadhil', username: 'hassan', email: 'hassan.fadhil@company.com', role: AppRole.Employee, departmentId: 'dept-network', departmentName: 'Network', jobTitle: 'Network Technician' }),

  user({ id: 'user-zainab', name: 'Zainab Noor', username: 'zainab', email: 'zainab.noor@company.com', role: AppRole.Manager, departmentId: 'dept-infra', departmentName: 'Infrastructure', jobTitle: 'Infrastructure Manager' }),
  user({ id: 'user-karim', name: 'Karim Saleh', username: 'karim', email: 'karim.saleh@company.com', role: AppRole.Employee, departmentId: 'dept-infra', departmentName: 'Infrastructure', jobTitle: 'Systems Administrator' }),
  user({ id: 'user-rana', name: 'Rana Adel', username: 'rana', email: 'rana.adel@company.com', role: AppRole.Employee, departmentId: 'dept-infra', departmentName: 'Infrastructure', jobTitle: 'Systems Administrator' }),

  user({ id: 'user-tariq', name: 'Tariq Salim', username: 'tariq', email: 'tariq.salim@company.com', role: AppRole.Manager, departmentId: 'dept-it', departmentName: 'IT Support', jobTitle: 'IT Support Manager' }),
  user({ id: 'user-dana', name: 'Dana Sami', username: 'dana', email: 'dana.sami@company.com', role: AppRole.Employee, departmentId: 'dept-it', departmentName: 'IT Support', jobTitle: 'IT Support Specialist' }),

  user({ id: 'user-yousif', name: 'Yousif Rahim', username: 'yousif', email: 'yousif.rahim@company.com', role: AppRole.Manager, departmentId: 'dept-finance', departmentName: 'Finance', jobTitle: 'Finance Manager' }),
  user({ id: 'user-lina', name: 'Lina Abbas', username: 'lina', email: 'lina.abbas@company.com', role: AppRole.Employee, departmentId: 'dept-finance', departmentName: 'Finance', jobTitle: 'Billing Specialist' }),

  user({ id: 'user-rasha', name: 'Rasha Kadhim', username: 'rasha', email: 'rasha.kadhim@company.com', role: AppRole.Manager, departmentId: 'dept-hr', departmentName: 'Human Resources', jobTitle: 'HR Manager' }),
  user({ id: 'user-bilal', name: 'Bilal Amir', username: 'bilal', email: 'bilal.amir@company.com', role: AppRole.Employee, departmentId: 'dept-hr', departmentName: 'Human Resources', jobTitle: 'HR Officer' }),

  user({ id: 'user-nadia', name: 'Nadia Fares', username: 'nadia', email: 'nadia.fares@company.com', role: AppRole.Management, jobTitle: 'Director of Operations' }),
  user({ id: 'user-admin', name: 'System Administrator', username: 'admin', email: 'admin@company.com', role: AppRole.Administrator, jobTitle: 'System Administrator' }),

  user({ id: 'cust-user-mustafa', name: 'Mustafa Kareem', username: 'mustafa', email: 'mustafa.kareem@example.com', role: AppRole.Customer, jobTitle: undefined }),
];

export const customers: Customer[] = [
  { id: 'cust-1', name: 'Mustafa Kareem', phone: '+964 770 111 2233', email: 'mustafa.kareem@example.com', company: 'Al-Rasheed Trading Co.', createdAt: iso(-400) },
  { id: 'cust-2', name: 'Huda Aziz', phone: '+964 771 222 3344', email: 'huda.aziz@example.com', company: 'Dijla Logistics', createdAt: iso(-360) },
  { id: 'cust-3', name: 'Marwan Sabah', phone: '+964 772 333 4455', email: 'marwan.sabah@example.com', createdAt: iso(-300) },
  { id: 'cust-4', name: 'Noor Salim', phone: '+964 773 444 5566', email: 'noor.salim@example.com', company: 'Bright Star Retail', createdAt: iso(-200) },
  { id: 'cust-5', name: 'Farah Idris', phone: '+964 774 555 6677', email: 'farah.idris@example.com', createdAt: iso(-120) },
];

export const MOCK_PASSWORD = 'password123';

export function findUserByUsername(username: string): User | undefined {
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function requireDefaultPermission(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}
