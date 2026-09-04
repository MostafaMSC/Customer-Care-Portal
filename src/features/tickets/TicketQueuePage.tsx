import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Pagination } from '@/components/tables/Pagination';
import { TicketTable } from './components/TicketTable';
import { useTicketList } from './hooks/useTicketList';
import type { TicketListParams } from '@/services/api/ticketsApi';
import type { DashboardCount } from '@/types/domain';

export function TicketQueuePage({
  title,
  subtitle,
  actions,
  countsQueryKey,
  loadCounts,
  countKeyToParams,
  baseParams,
  ticketRoute,
  variant = 'internal',
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  countsQueryKey: unknown[];
  loadCounts: () => Promise<DashboardCount[]>;
  countKeyToParams: (key: string) => Partial<TicketListParams>;
  baseParams: TicketListParams;
  ticketRoute: (id: string) => string;
  variant?: 'customer' | 'internal' | 'manager';
}) {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: counts = [] } = useQuery({ queryKey: countsQueryKey, queryFn: loadCounts });

  const params: TicketListParams = {
    ...baseParams,
    ...(activeKey ? countKeyToParams(activeKey) : {}),
    search: search || undefined,
    page,
    pageSize: 10,
  };
  const { data, isLoading, error, refetch } = useTicketList(params);

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />

      {counts.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {counts.map((c) => (
            <StatCard
              key={c.key}
              label={c.label}
              value={c.count}
              tone={c.tone}
              active={activeKey === c.key}
              onClick={() => {
                setActiveKey(activeKey === c.key ? null : c.key);
                setPage(1);
              }}
            />
          ))}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-3 border-b border-border p-3">
          <div className="flex max-w-xs flex-1 items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-text-faint" />
            <Input
              className="border-0 p-0 focus:outline-none"
              placeholder="Search ticket #, subject, customer…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <TicketTable
          rows={data?.items ?? []}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          onRowClick={(t) => navigate(ticketRoute(t.id))}
          variant={variant}
        />
        {data && data.totalCount > 0 && (
          <Pagination page={data.page} totalPages={data.totalPages} totalCount={data.totalCount} onPageChange={setPage} />
        )}
      </Card>
    </div>
  );
}
