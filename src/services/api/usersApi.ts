import type { User } from '@/types/domain';
import { delay } from '@/services/mock/helpers';
import { users } from '@/services/mock/seedOrg';

export const usersApi = {
  async list(): Promise<User[]> {
    return delay([...users]);
  },
  async get(id: string): Promise<User | undefined> {
    return delay(users.find((u) => u.id === id));
  },
};
