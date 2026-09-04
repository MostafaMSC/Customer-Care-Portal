import { useQuery } from '@tanstack/react-query';
import { ticketsApi, type TicketListParams } from '@/services/api/ticketsApi';

export function useTicketList(params: TicketListParams) {
  return useQuery({
    queryKey: ['tickets', 'list', params],
    queryFn: () => ticketsApi.list(params),
    placeholderData: (prev) => prev,
  });
}
