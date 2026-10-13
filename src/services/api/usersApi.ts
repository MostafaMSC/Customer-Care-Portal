import type { AppRole, User } from '@/types/domain';
import { ApiError } from '@/types/api';
import { delay } from '@/services/mock/helpers';
import { users } from '@/services/mock/seedOrg';
import { apiClient } from './client';
import { isRealMode } from './mode';
import type { Envelope, Paged, UserSummaryDto } from './real/dto';
import { ROLE_TO_API, userSummaryToUser } from './real/mappers';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  phone?: string;
  jobTitle?: string;
  primaryDepartmentId?: string;
  customerId?: string;
  departments?: { departmentId: string; role?: 'MANAGER' | 'MEMBER' }[];
}

export interface UpdateUserInput {
  fullName?: string;
  phone?: string;
  jobTitle?: string;
  role?: AppRole;
  primaryDepartmentId?: string;
  isActive?: boolean;
  password?: string;
}

export interface UserListFilters {
  role?: AppRole;
  departmentId?: string;
  search?: string;
  isActive?: boolean;
}

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export const usersApi = {
  async list(filters: UserListFilters = {}): Promise<User[]> {
    if (!isRealMode) return delay([...users]);
    const out: User[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const res = await apiClient.get<Paged<UserSummaryDto>>('/api/users', {
        params: { page, pageSize: PAGE_SIZE, role: filters.role ? ROLE_TO_API[filters.role] : undefined, departmentId: filters.departmentId, search: filters.search, isActive: filters.isActive },
      });
      out.push(...(res.data.items ?? []).map(userSummaryToUser));
      if (page >= (res.data.meta?.totalPages ?? 1)) break;
    }
    return out;
  },

  async get(id: string): Promise<User | undefined> {
    if (!isRealMode) return delay(users.find((u) => u.id === id));
    const res = await apiClient.get<Envelope<UserSummaryDto>>(`/api/users/${id}`);
    return userSummaryToUser(res.data.data);
  },

  async create(input: CreateUserInput): Promise<User> {
    if (!isRealMode) throw notMocked('Creating a user');
    const res = await apiClient.post<Envelope<UserSummaryDto>>('/api/users', { ...input, role: ROLE_TO_API[input.role] });
    return userSummaryToUser(res.data.data);
  },

  async update(id: string, patch: UpdateUserInput): Promise<User> {
    if (!isRealMode) throw notMocked('Updating a user');
    const res = await apiClient.patch<Envelope<UserSummaryDto>>(`/api/users/${id}`, { ...patch, role: patch.role ? ROLE_TO_API[patch.role] : undefined });
    return userSummaryToUser(res.data.data);
  },

  /** Soft delete: history is preserved. */
  async deactivate(id: string): Promise<void> {
    if (!isRealMode) throw notMocked('Deactivating a user');
    await apiClient.delete(`/api/users/${id}`);
  },
};

function notMocked(action: string) {
  return new ApiError({ status: 501, message: `${action} is only available against the real backend.` });
}
