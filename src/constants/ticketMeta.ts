import { AssignmentType, TicketPriority, TicketSource, TicketStatus } from '@/types/ticket';
import type { Tone } from '@/components/ui/Badge';

export const PRIORITY_META: Record<TicketPriority, { label: string; tone: Tone }> = {
  [TicketPriority.Low]: { label: 'Low', tone: 'neutral' },
  [TicketPriority.Normal]: { label: 'Normal', tone: 'info' },
  [TicketPriority.High]: { label: 'High', tone: 'warning' },
  [TicketPriority.Urgent]: { label: 'Urgent', tone: 'danger' },
  [TicketPriority.Critical]: { label: 'Critical', tone: 'critical' },
};

export const STATUS_META: Record<TicketStatus, { label: string; tone: Tone }> = {
  [TicketStatus.New]: { label: 'New', tone: 'info' },
  [TicketStatus.Received]: { label: 'Received', tone: 'info' },
  [TicketStatus.UnderReview]: { label: 'Under Review', tone: 'neutral' },
  [TicketStatus.Assigned]: { label: 'Assigned', tone: 'brand' },
  [TicketStatus.InProgress]: { label: 'In Progress', tone: 'brand' },
  [TicketStatus.WaitingForCustomer]: { label: 'Waiting for Customer', tone: 'warning' },
  [TicketStatus.WaitingForDepartment]: { label: 'Waiting for Department', tone: 'warning' },
  [TicketStatus.Transferred]: { label: 'Transferred', tone: 'neutral' },
  [TicketStatus.Resolved]: { label: 'Resolved', tone: 'success' },
  [TicketStatus.Closed]: { label: 'Closed', tone: 'neutral' },
  [TicketStatus.Reopened]: { label: 'Reopened', tone: 'danger' },
  [TicketStatus.Cancelled]: { label: 'Cancelled', tone: 'neutral' },
};

export const SOURCE_META: Record<TicketSource, { label: string; icon: string }> = {
  [TicketSource.PhoneCall]: { label: 'Phone Call', icon: 'phone' },
  [TicketSource.CustomerPortal]: { label: 'Customer Portal', icon: 'globe' },
  [TicketSource.CustomerCare]: { label: 'Customer Care', icon: 'headset' },
  [TicketSource.Email]: { label: 'Email', icon: 'mail' },
  [TicketSource.Api]: { label: 'API', icon: 'code' },
  [TicketSource.Pbx]: { label: 'PBX', icon: 'phone-call' },
};

export const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  [AssignmentType.Individual]: 'Individual',
  [AssignmentType.MultipleEmployees]: 'Multiple Employees',
  [AssignmentType.EntireDepartment]: 'Entire Team',
};

export const PRIORITY_ORDER: TicketPriority[] = [
  TicketPriority.Low,
  TicketPriority.Normal,
  TicketPriority.High,
  TicketPriority.Urgent,
  TicketPriority.Critical,
];
