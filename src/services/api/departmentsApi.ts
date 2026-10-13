import type { Department, TeamMemberSummary } from '@/types/domain';
import type { CollaborationRequest } from '@/types/ticket';
import { ApiError } from '@/types/api';
import { delay } from '@/services/mock/helpers';
import { departments, users } from '@/services/mock/seedOrg';
import { apiClient } from './client';
import { isRealMode } from './mode';
import { routableDepartments } from './ticketsApi';
import type { CollaborationRequestDto, DepartmentDto, Envelope, UserSummaryDto } from './real/dto';
import { collaborationToDomain, departmentToDomain } from './real/mappers';

function withManagerName(dept: Department): Department {
  return { ...dept, managerName: users.find((u) => u.id === dept.managerId)?.name };
}

export interface DepartmentInput {
  name: string;
  code: string;
  description?: string;
  kind?: 'CUSTOMER_CARE' | 'OPERATIONS';
  slaHours?: number;
}

async function fetchDepartments(includeInactive = false): Promise<DepartmentDto[]> {
  const res = await apiClient.get<Envelope<DepartmentDto[]>>('/api/departments', { params: { includeInactive } });
  return res.data.data;
}

async function fetchDepartmentDetail(id: string): Promise<DepartmentDto | undefined> {
  try {
    return (await apiClient.get<Envelope<DepartmentDto>>(`/api/departments/${id}`)).data.data;
  } catch {
    return undefined;
  }
}

export const departmentsApi = {
  async list(): Promise<Department[]> {
    if (!isRealMode) return delay(departments.map(withManagerName));
    const list = await fetchDepartments();
    // The list omits managers; the detail endpoint includes them.
    const detailed = await Promise.all(list.map(async (d) => (await fetchDepartmentDetail(d.id)) ?? d));
    return detailed.map((d, i) => departmentToDomain({ ...list[i], ...d }));
  },

  /** Departments a ticket can be forwarded / transferred to (everything except Customer Care). */
  async listRoutable(): Promise<Department[]> {
    if (!isRealMode) return delay(routableDepartments().map(withManagerName));
    const list = await fetchDepartments();
    return list.filter((d) => d.kind !== 'CUSTOMER_CARE' && d.isActive !== false).map(departmentToDomain);
  },

  async get(id: string): Promise<Department | undefined> {
    if (!isRealMode) return delay(departments.find((d) => d.id === id));
    const dto = await fetchDepartmentDetail(id);
    return dto ? departmentToDomain(dto) : undefined;
  },

  async teamMembers(departmentId: string): Promise<TeamMemberSummary[]> {
    if (!isRealMode) {
      const dept = departments.find((d) => d.id === departmentId);
      const members = users
        .filter((u) => u.departmentId === departmentId && u.role !== 'Manager')
        .map((u) => ({ id: u.id, name: u.name, jobTitle: u.jobTitle, isManager: u.id === dept?.managerId }));
      return delay(members);
    }
    const res = await apiClient.get<Envelope<UserSummaryDto[]>>(`/api/departments/${departmentId}/members`);
    // Managers are not assignable "employees"; the assign dialog only offers the team.
    return res.data.data
      .filter((u) => u.role !== 'DEPARTMENT_MANAGER')
      .map((u) => ({ id: u.id, name: u.fullName ?? u.email ?? u.id, jobTitle: u.jobTitle ?? undefined, isManager: false }));
  },

  async create(input: DepartmentInput): Promise<Department> {
    if (!isRealMode) throw notMocked('Creating a department');
    const res = await apiClient.post<Envelope<DepartmentDto>>('/api/departments', input);
    return departmentToDomain(res.data.data);
  },

  async update(id: string, patch: Partial<DepartmentInput> & { isActive?: boolean }): Promise<Department> {
    if (!isRealMode) throw notMocked('Updating a department');
    const res = await apiClient.patch<Envelope<DepartmentDto>>(`/api/departments/${id}`, patch);
    return departmentToDomain(res.data.data);
  },

  async addMember(departmentId: string, userId: string, role: 'MANAGER' | 'MEMBER' = 'MEMBER'): Promise<void> {
    if (!isRealMode) throw notMocked('Adding a department member');
    await apiClient.post(`/api/departments/${departmentId}/members`, { userId, role });
  },

  async removeMember(departmentId: string, userId: string): Promise<void> {
    if (!isRealMode) throw notMocked('Removing a department member');
    await apiClient.delete(`/api/departments/${departmentId}/members/${userId}`);
  },

  /** Assistance requests addressed to this department. */
  async collaborationRequests(departmentId: string, status?: CollaborationRequestDto['status']): Promise<CollaborationRequest[]> {
    if (!isRealMode) return delay([]);
    const res = await apiClient.get<Envelope<CollaborationRequestDto[]>>(`/api/departments/${departmentId}/collaboration-requests`, { params: { status } });
    return res.data.data.map((c) => collaborationToDomain(c, ''));
  },
};

function notMocked(action: string) {
  return new ApiError({ status: 501, message: `${action} is only available against the real backend.` });
}
