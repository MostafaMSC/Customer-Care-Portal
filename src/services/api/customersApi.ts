import type { Customer } from '@/types/domain';
import { ApiError } from '@/types/api';
import { delay } from '@/services/mock/helpers';
import { customers } from '@/services/mock/seedOrg';
import { apiClient } from './client';
import { isRealMode } from './mode';
import type { CustomerDto, Envelope, Paged } from './real/dto';
import { customerToDomain } from './real/mappers';

export interface CustomerInput {
  fullName: string;
  primaryPhone: string;
  code?: string;
  companyName?: string;
  altPhone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export const customersApi = {
  async search(term: string): Promise<Customer[]> {
    if (!isRealMode) {
      const t = term.trim().toLowerCase();
      const matches = t
        ? customers.filter((c) => c.name.toLowerCase().includes(t) || c.phone.includes(t) || c.email?.toLowerCase().includes(t))
        : customers;
      return delay(matches.slice(0, 20));
    }
    const res = await apiClient.get<Paged<CustomerDto>>('/api/customers', { params: { search: term.trim() || undefined, pageSize: 20 } });
    return (res.data.items ?? []).map(customerToDomain);
  },

  async get(id: string): Promise<Customer | undefined> {
    if (!isRealMode) return delay(customers.find((c) => c.id === id));
    const res = await apiClient.get<Envelope<CustomerDto>>(`/api/customers/${id}`);
    return customerToDomain(res.data.data);
  },

  async create(input: CustomerInput): Promise<Customer> {
    if (!isRealMode) throw notMocked('Creating a customer');
    const res = await apiClient.post<Envelope<CustomerDto>>('/api/customers', input);
    return customerToDomain(res.data.data);
  },

  async update(id: string, patch: Partial<CustomerInput> & { isActive?: boolean }): Promise<Customer> {
    if (!isRealMode) throw notMocked('Updating a customer');
    const res = await apiClient.patch<Envelope<CustomerDto>>(`/api/customers/${id}`, patch);
    return customerToDomain(res.data.data);
  },

  /**
   * PBX screen pop: matches the caller's phone number. The response shape is untyped in the API spec
   * (an object with the matches and their latest tickets), so it is returned as-is.
   */
  async lookupByPhone(phone: string): Promise<unknown> {
    if (!isRealMode) {
      const digits = phone.replace(/\D/g, '');
      return delay({ customers: customers.filter((c) => c.phone.replace(/\D/g, '').includes(digits)) });
    }
    const res = await apiClient.get<Envelope<unknown>>('/api/customers/lookup', { params: { phone } });
    return res.data.data;
  },
};

function notMocked(action: string) {
  return new ApiError({ status: 501, message: `${action} is only available against the real backend.` });
}
