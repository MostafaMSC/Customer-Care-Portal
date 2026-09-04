import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { RequireAuth } from '@/app/router/RequireAuth';
import { RequireRole } from '@/app/router/RequireRole';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/feedback/Toaster';
import { ROUTES } from '@/constants/routes';
import { AppRole } from '@/types/domain';
import { useAuthStore } from '@/store/authStore';
import { ROLE_HOME } from '@/constants/nav';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));

const CustomerDashboardPage = lazy(() => import('@/pages/customer/CustomerDashboardPage'));
const CustomerTicketsPage = lazy(() => import('@/pages/customer/CustomerTicketsPage'));
const CustomerNewTicketPage = lazy(() => import('@/pages/customer/CustomerNewTicketPage'));
const CustomerTicketDetailPage = lazy(() => import('@/pages/customer/CustomerTicketDetailPage'));
const CustomerProfilePage = lazy(() => import('@/pages/customer/CustomerProfilePage'));

const CustomerCareDashboardPage = lazy(() => import('@/pages/customer-care/CustomerCareDashboardPage'));
const CustomerCareTicketsPage = lazy(() => import('@/pages/customer-care/CustomerCareTicketsPage'));
const CustomerCareNewTicketPage = lazy(() => import('@/pages/customer-care/CustomerCareNewTicketPage'));
const CustomerCareTicketDetailPage = lazy(() => import('@/pages/customer-care/CustomerCareTicketDetailPage'));

const EmployeeDashboardPage = lazy(() => import('@/pages/employee/EmployeeDashboardPage'));
const EmployeeTicketDetailPage = lazy(() => import('@/pages/employee/EmployeeTicketDetailPage'));

const ManagerDashboardPage = lazy(() => import('@/pages/manager/ManagerDashboardPage'));
const ManagerIncomingPage = lazy(() => import('@/pages/manager/ManagerIncomingPage'));
const ManagerTicketDetailPage = lazy(() => import('@/pages/manager/ManagerTicketDetailPage'));
const ManagerTeamPage = lazy(() => import('@/pages/manager/ManagerTeamPage'));

const ManagementDashboardPage = lazy(() => import('@/pages/management/ManagementDashboardPage'));
const ReportsPage = lazy(() => import('@/pages/management/ReportsPage'));
const DepartmentsPage = lazy(() => import('@/pages/management/DepartmentsPage'));
const EmployeesPage = lazy(() => import('@/pages/management/EmployeesPage'));

const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={user ? ROLE_HOME[user.role] : ROUTES.login} replace />;
}

function PageFallback() {
  return <div className="flex h-screen items-center justify-center text-sm text-text-muted">Loading…</div>;
}

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.forbidden} element={<ForbiddenPage />} />

            <Route element={<RequireAuth />}>
              <Route path="/" element={<RootRedirect />} />

              <Route element={<RequireRole roles={[AppRole.Customer]} />}>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.customer.root} element={<CustomerDashboardPage />} />
                  <Route path={ROUTES.customer.tickets} element={<CustomerTicketsPage />} />
                  <Route path={ROUTES.customer.newTicket} element={<CustomerNewTicketPage />} />
                  <Route path="/customer/tickets/:id" element={<CustomerTicketDetailPage />} />
                  <Route path={ROUTES.customer.profile} element={<CustomerProfilePage />} />
                </Route>
              </Route>

              <Route element={<RequireRole roles={[AppRole.CustomerCare]} />}>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.customerCare.root} element={<CustomerCareDashboardPage />} />
                  <Route path={ROUTES.customerCare.tickets} element={<CustomerCareTicketsPage />} />
                  <Route path={ROUTES.customerCare.newTicket} element={<CustomerCareNewTicketPage />} />
                  <Route path="/customer-care/tickets/:id" element={<CustomerCareTicketDetailPage />} />
                </Route>
              </Route>

              <Route element={<RequireRole roles={[AppRole.Employee]} />}>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.employee.root} element={<EmployeeDashboardPage />} />
                  <Route path={ROUTES.employee.tickets} element={<EmployeeDashboardPage />} />
                  <Route path="/employee/tickets/:id" element={<EmployeeTicketDetailPage />} />
                </Route>
              </Route>

              <Route element={<RequireRole roles={[AppRole.Manager]} />}>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.manager.root} element={<ManagerDashboardPage />} />
                  <Route path={ROUTES.manager.incoming} element={<ManagerIncomingPage />} />
                  <Route path={ROUTES.manager.tickets} element={<ManagerDashboardPage />} />
                  <Route path="/manager/tickets/:id" element={<ManagerTicketDetailPage />} />
                  <Route path={ROUTES.manager.team} element={<ManagerTeamPage />} />
                </Route>
              </Route>

              <Route element={<RequireRole roles={[AppRole.Management, AppRole.Administrator]} />}>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.management.root} element={<ManagementDashboardPage />} />
                  <Route path={ROUTES.management.reports} element={<ReportsPage />} />
                  <Route path={ROUTES.management.departments} element={<DepartmentsPage />} />
                  <Route path={ROUTES.management.employees} element={<EmployeesPage />} />
                </Route>
              </Route>

              <Route element={<RequireRole roles={[AppRole.Administrator]} />}>
                <Route element={<AppLayout />}>
                  <Route path={ROUTES.admin.users} element={<AdminUsersPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </QueryProvider>
  );
}
