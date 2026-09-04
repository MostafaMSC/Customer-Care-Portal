import type { Department, TeamMemberSummary } from '@/types/domain';
import { delay } from '@/services/mock/helpers';
import { departments, users } from '@/services/mock/seedOrg';
import { routableDepartments } from './ticketsApi';

function withManagerName(dept: Department): Department {
  return { ...dept, managerName: users.find((u) => u.id === dept.managerId)?.name };
}

export const departmentsApi = {
  async list(): Promise<Department[]> {
    return delay(departments.map(withManagerName));
  },

  async listRoutable(): Promise<Department[]> {
    return delay(routableDepartments().map(withManagerName));
  },

  async teamMembers(departmentId: string): Promise<TeamMemberSummary[]> {
    const dept = departments.find((d) => d.id === departmentId);
    const members = users
      .filter((u) => u.departmentId === departmentId && u.role !== 'Manager')
      .map((u) => ({ id: u.id, name: u.name, jobTitle: u.jobTitle, isManager: u.id === dept?.managerId }));
    return delay(members);
  },
};
