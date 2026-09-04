export interface DepartmentPerformanceRow {
  departmentId: string;
  departmentName: string;
  received: number;
  resolved: number;
  closed: number;
  avgResponseHours: number;
  avgResolutionHours: number;
  slaCompliancePct: number;
  overdue: number;
  transfers: number;
  reopened: number;
}

export interface EmployeePerformanceRow {
  userId: string;
  userName: string;
  departmentName: string;
  assigned: number;
  completed: number;
  avgResponseHours: number;
  avgResolutionHours: number;
  slaCompliancePct: number;
  overdue: number;
  reopened: number;
}

export interface DistributionSlice {
  label: string;
  value: number;
}

export interface TicketAnalytics {
  bySource: DistributionSlice[];
  byPriority: DistributionSlice[];
  byStatus: DistributionSlice[];
  byDepartment: DistributionSlice[];
}

export interface ManagementKpis {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  overdueTickets: number;
  slaCompliancePct: number;
  avgResolutionHours: number;
}

export interface ReportFilters {
  departmentId?: string;
  priority?: string;
}
