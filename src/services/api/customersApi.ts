import type { Customer } from '@/types/domain';
import { delay } from '@/services/mock/helpers';
import { customers } from '@/services/mock/seedOrg';

export const customersApi = {
  async search(term: string): Promise<Customer[]> {
    const t = term.trim().toLowerCase();
    const matches = t
      ? customers.filter((c) => c.name.toLowerCase().includes(t) || c.phone.includes(t) || c.email?.toLowerCase().includes(t))
      : customers;
    return delay(matches.slice(0, 20));
  },
  async get(id: string): Promise<Customer | undefined> {
    return delay(customers.find((c) => c.id === id));
  },
};
