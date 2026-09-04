import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/feedback/Skeleton';
import { reportsApi } from '@/services/api/reportsApi';
import { AlertTriangle, CheckCircle2, Clock, Gauge, Ticket, TrendingUp } from 'lucide-react';

export default function ManagementDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['reports', 'management-kpis'], queryFn: reportsApi.managementKpis });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Management Overview" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Management Overview" subtitle="Company-wide ticket KPIs" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Tickets" value={data.totalTickets} icon={Ticket} tone="brand" />
        <StatCard label="Open Tickets" value={data.openTickets} icon={Clock} tone="info" />
        <StatCard label="Resolved Today" value={data.resolvedToday} icon={CheckCircle2} tone="success" />
        <StatCard label="Overdue" value={data.overdueTickets} icon={AlertTriangle} tone="danger" />
        <StatCard label="SLA Compliance" value={`${data.slaCompliancePct}%`} icon={Gauge} tone="success" />
        <StatCard label="Avg. Resolution" value={`${data.avgResolutionHours}h`} icon={TrendingUp} tone="neutral" />
      </div>

      <Card className="mt-5">
        <CardHeader title="Where to go next" />
        <CardBody className="text-sm text-text-muted">
          Use <span className="font-medium text-text">Reports</span> for department/employee performance and ticket analytics, or{' '}
          <span className="font-medium text-text">Departments</span> to see routing ownership and managers.
        </CardBody>
      </Card>
    </div>
  );
}
