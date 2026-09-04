import { useMutation } from '@tanstack/react-query';
import { ticketsApi } from '@/services/api/ticketsApi';
import { useInvalidateTicket } from './useTicketDetail';
import { notifyError, notifySuccess } from '@/store/uiStore';
import { ApiError } from '@/types/api';
import type {
  AssignTicketPayload,
  ForwardTicketPayload,
  RequestAssistancePayload,
  RespondAssistancePayload,
  TicketPriority,
  TicketStatus,
  TransferTicketPayload,
} from '@/types/ticket';

function useTicketAction<TArgs extends unknown[]>(
  successMessage: string,
  fn: (...args: TArgs) => Promise<unknown>,
  invalidate: () => void,
) {
  return useMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSuccess: () => {
      notifySuccess(successMessage);
      invalidate();
    },
    onError: (error) => notifyError(error instanceof ApiError ? error.message : 'Action failed.'),
  });
}

export function useTicketActions(ticketId: string) {
  const invalidate = useInvalidateTicket(ticketId);

  const forwardMutation = useTicketAction('Ticket forwarded to the department.', (payload: ForwardTicketPayload) => ticketsApi.forward(ticketId, payload), invalidate);
  const assignMutation = useTicketAction('Assignment saved.', (payload: AssignTicketPayload) => ticketsApi.assign(ticketId, payload), invalidate);
  const addMemberMutation = useTicketAction('Employee added to the assignment.', (employeeId: string) => ticketsApi.addAssignmentMember(ticketId, employeeId), invalidate);
  const removeMemberMutation = useTicketAction('Employee removed from the assignment.', (employeeId: string) => ticketsApi.removeAssignmentMember(ticketId, employeeId), invalidate);
  const unassignMutation = useTicketAction('Ticket returned to the department queue.', (note?: string) => ticketsApi.unassign(ticketId, note), invalidate);
  const transferMutation = useTicketAction('Ticket transferred to the new department.', (payload: TransferTicketPayload) => ticketsApi.transfer(ticketId, payload), invalidate);
  const requestAssistanceMutation = useTicketAction('Assistance requested.', (payload: RequestAssistancePayload) => ticketsApi.requestAssistance(ticketId, payload), invalidate);
  const respondAssistanceMutation = useTicketAction('Response recorded.', (payload: RespondAssistancePayload) => ticketsApi.respondAssistance(ticketId, payload), invalidate);
  const changeStatusMutation = useTicketAction('Status updated.', (status: TicketStatus, note?: string) => ticketsApi.changeStatus(ticketId, status, note), invalidate);
  const changePriorityMutation = useTicketAction('Priority updated.', (priority: TicketPriority) => ticketsApi.changePriority(ticketId, priority), invalidate);
  const escalateMutation = useTicketAction('Ticket escalated.', (reason?: string) => ticketsApi.escalate(ticketId, reason), invalidate);
  const addCommentMutation = useTicketAction('Message sent.', (message: string, visibility: 'Customer' | 'Internal') => ticketsApi.addComment(ticketId, message, visibility), invalidate);

  return {
    forward: (payload: ForwardTicketPayload) => forwardMutation.mutateAsync([payload]),
    assign: (payload: AssignTicketPayload) => assignMutation.mutateAsync([payload]),
    addMember: (employeeId: string) => addMemberMutation.mutateAsync([employeeId]),
    removeMember: (employeeId: string) => removeMemberMutation.mutateAsync([employeeId]),
    unassign: (note?: string) => unassignMutation.mutateAsync([note]),
    transfer: (payload: TransferTicketPayload) => transferMutation.mutateAsync([payload]),
    requestAssistance: (payload: RequestAssistancePayload) => requestAssistanceMutation.mutateAsync([payload]),
    respondAssistance: (payload: RespondAssistancePayload) => respondAssistanceMutation.mutateAsync([payload]),
    changeStatus: (status: TicketStatus, note?: string) => changeStatusMutation.mutateAsync([status, note]),
    changePriority: (priority: TicketPriority) => changePriorityMutation.mutateAsync([priority]),
    escalate: (reason?: string) => escalateMutation.mutateAsync([reason]),
    addComment: (message: string, visibility: 'Customer' | 'Internal') => addCommentMutation.mutateAsync([message, visibility]),
    isBusy:
      forwardMutation.isPending ||
      assignMutation.isPending ||
      addMemberMutation.isPending ||
      removeMemberMutation.isPending ||
      unassignMutation.isPending ||
      transferMutation.isPending ||
      requestAssistanceMutation.isPending ||
      respondAssistanceMutation.isPending ||
      changeStatusMutation.isPending ||
      changePriorityMutation.isPending ||
      escalateMutation.isPending ||
      addCommentMutation.isPending,
  };
}
