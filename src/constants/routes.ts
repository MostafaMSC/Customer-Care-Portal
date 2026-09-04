export const ROUTES = {
  login: '/login',
  forbidden: '/403',

  customer: {
    root: '/customer',
    tickets: '/customer/tickets',
    newTicket: '/customer/tickets/new',
    ticket: (id: string) => `/customer/tickets/${id}`,
    profile: '/customer/profile',
  },

  customerCare: {
    root: '/customer-care',
    tickets: '/customer-care/tickets',
    newTicket: '/customer-care/tickets/new',
    ticket: (id: string) => `/customer-care/tickets/${id}`,
  },

  employee: {
    root: '/employee',
    tickets: '/employee/tickets',
    ticket: (id: string) => `/employee/tickets/${id}`,
  },

  manager: {
    root: '/manager',
    incoming: '/manager/incoming',
    tickets: '/manager/tickets',
    ticket: (id: string) => `/manager/tickets/${id}`,
    team: '/manager/team',
  },

  management: {
    root: '/management',
    reports: '/management/reports',
    departments: '/management/departments',
    employees: '/management/employees',
  },

  admin: {
    root: '/admin',
    users: '/admin/users',
    departments: '/admin/departments',
  },
} as const;
