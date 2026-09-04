import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/services/api/ticketsApi';

export function useTicketDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['tickets', 'detail', id],
    queryFn: () => ticketsApi.get(id as string),
    enabled: !!id,
  });
}

export function useInvalidateTicket(id: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['tickets', 'detail', id] });
    queryClient.invalidateQueries({ queryKey: ['tickets', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-counts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
}
