import { useState } from 'react';
import { ArrowRightLeft, Flag, Handshake, ShieldAlert, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/usePermission';
import { AppRole, Permission } from '@/types/domain';
import { useTicketDetail } from './hooks/useTicketDetail';
import { useTicketActions } from './hooks/useTicketActions';
import { TicketHeader } from './components/TicketHeader';
import { TicketInfoGrid } from './components/TicketInfoGrid';
import { AssignmentPanel } from './components/AssignmentPanel';
import { CollaborationPanel } from './components/CollaborationPanel';
import { TicketConversation } from './components/TicketConversation';
import { TicketTimeline } from './components/TicketTimeline';
import { ForwardDialog } from './dialogs/ForwardDialog';
import { AssignDialog } from './dialogs/AssignDialog';
import { TransferDialog } from './dialogs/TransferDialog';
import { RequestAssistanceDialog } from './dialogs/RequestAssistanceDialog';
import { RespondAssistanceDialog } from './dialogs/RespondAssistanceDialog';
import { ChangePriorityDialog } from './dialogs/ChangePriorityDialog';
import { ChangeStatusDialog } from './dialogs/ChangeStatusDialog';
import { EscalateDialog } from './dialogs/EscalateDialog';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { CollaborationRequest } from '@/types/ticket';
import { isUserInvolvedInTicket } from '@/services/mock/db';

type DialogKind = 'forward' | 'assign' | 'transfer' | 'requestAssistance' | 'priority' | 'status' | 'escalate' | null;

export function TicketDetailView({ ticketId, backTo }: { ticketId: string; backTo: string }) {
  const user = useAuthStore((s) => s.user)!;
  const { can } = usePermission();
  const { data: ticket, isLoading, error, refetch } = useTicketDetail(ticketId);
  const actions = useTicketActions(ticketId);

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [respondingTo, setRespondingTo] = useState<CollaborationRequest | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error || !ticket) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  const isManagerOfDept = user.role === AppRole.Manager && !!ticket.currentDepartmentId && ticket.currentDepartmentId === user.departmentId;
  const involvement = isUserInvolvedInTicket(ticket, user);
  const isAssignedEmployee = user.role === AppRole.Employee && involvement !== null;
  const isAdmin = user.role === AppRole.Administrator;

  const canForward = can(Permission.TicketForward) && !ticket.currentDepartmentId;
  const canAssign = (isManagerOfDept || isAdmin) && can(Permission.TicketAssign);
  const canTransfer = (isManagerOfDept || isAdmin) && can(Permission.TicketTransfer) && !!ticket.currentDepartmentId;
  const canRequestAssistance = (isManagerOfDept || isAssignedEmployee || isAdmin) && can(Permission.TicketCollaborationRequest) && !!ticket.currentDepartmentId;
  const canRespondAssistance = (isManagerOfDept || isAssignedEmployee || isAdmin) && can(Permission.TicketCollaborationRespond);
  const canChangePriority = can(Permission.TicketChangePriority);
  const canChangeStatus = (isManagerOfDept || isAssignedEmployee || isAdmin) && can(Permission.TicketChangeStatus);
  const canEscalate = (isManagerOfDept || isAdmin) && can(Permission.TicketEscalate);
  const canAddInternalNote = can(Permission.TicketAddInternalComment) && (isManagerOfDept || isAssignedEmployee || user.role === AppRole.CustomerCare || isAdmin);
  const canRespondCustomer = can(Permission.TicketAddCustomerResponse) && (isManagerOfDept || isAssignedEmployee || isAdmin);

  return (
    <div>
      <TicketHeader ticket={ticket} backTo={backTo} />

      <Card className="mb-4">
        <CardBody className="flex flex-wrap gap-2">
          {canForward && (
            <Button size="sm" icon={<ArrowRightLeft className="h-3.5 w-3.5" />} onClick={() => setDialog('forward')}>
              Forward Ticket
            </Button>
          )}
          {canAssign && (
            <Button size="sm" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setDialog('assign')}>
              {ticket.currentAssignment?.isActive ? 'Reassign' : 'Assign'}
            </Button>
          )}
          {canTransfer && (
            <Button size="sm" variant="outline" icon={<ArrowRightLeft className="h-3.5 w-3.5" />} onClick={() => setDialog('transfer')}>
              Transfer Department
            </Button>
          )}
          {canRequestAssistance && (
            <Button size="sm" variant="outline" icon={<Handshake className="h-3.5 w-3.5" />} onClick={() => setDialog('requestAssistance')}>
              Request Assistance
            </Button>
          )}
          {canChangePriority && (
            <Button size="sm" variant="outline" icon={<Flag className="h-3.5 w-3.5" />} onClick={() => setDialog('priority')}>
              Change Priority
            </Button>
          )}
          {canChangeStatus && (
            <Button size="sm" variant="outline" onClick={() => setDialog('status')}>
              Change Status
            </Button>
          )}
          {canEscalate && !ticket.isEscalated && (
            <Button size="sm" variant="ghost" icon={<ShieldAlert className="h-3.5 w-3.5" />} onClick={() => setDialog('escalate')}>
              Escalate
            </Button>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col gap-4">
        <TicketInfoGrid ticket={ticket} />

        {ticket.currentDepartmentId && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AssignmentPanel
              assignment={ticket.currentAssignment}
              canManage={canAssign}
              onAssignClick={() => setDialog('assign')}
              onUnassign={() => actions.unassign()}
              onRemoveMember={(employeeId) => actions.removeMember(employeeId)}
            />
            <CollaborationPanel
              requests={ticket.collaborationRequests}
              canRequest={canRequestAssistance}
              canRespond={canRespondAssistance}
              currentUserDepartmentId={user.departmentId}
              onRequestClick={() => setDialog('requestAssistance')}
              onRespondClick={(request) => setRespondingTo(request)}
            />
          </div>
        )}

        <TicketConversation
          comments={ticket.comments}
          canAddInternalNote={canAddInternalNote}
          canRespond={canRespondCustomer || canAddInternalNote}
          isSubmitting={actions.isBusy}
          onSubmit={(message, visibility) => actions.addComment(message, visibility)}
        />

        <TicketTimeline events={ticket.timeline} />
      </div>

      <ForwardDialog open={dialog === 'forward'} onClose={() => setDialog(null)} onSubmit={actions.forward} isSubmitting={actions.isBusy} />
      {ticket.currentDepartmentId && (
        <AssignDialog
          open={dialog === 'assign'}
          onClose={() => setDialog(null)}
          departmentId={ticket.currentDepartmentId}
          onSubmit={actions.assign}
          isSubmitting={actions.isBusy}
          preselectedEmployeeIds={ticket.currentAssignment?.isActive ? ticket.currentAssignment.members.filter((m) => m.isActive).map((m) => m.userId) : []}
        />
      )}
      <TransferDialog
        open={dialog === 'transfer'}
        onClose={() => setDialog(null)}
        currentDepartmentId={ticket.currentDepartmentId}
        onSubmit={actions.transfer}
        isSubmitting={actions.isBusy}
      />
      <RequestAssistanceDialog
        open={dialog === 'requestAssistance'}
        onClose={() => setDialog(null)}
        currentDepartmentId={ticket.currentDepartmentId}
        onSubmit={actions.requestAssistance}
        isSubmitting={actions.isBusy}
      />
      <RespondAssistanceDialog
        open={!!respondingTo}
        onClose={() => setRespondingTo(null)}
        request={respondingTo}
        onSubmit={actions.respondAssistance}
        isSubmitting={actions.isBusy}
      />
      <ChangePriorityDialog
        open={dialog === 'priority'}
        onClose={() => setDialog(null)}
        currentPriority={ticket.priority}
        onSubmit={actions.changePriority}
        isSubmitting={actions.isBusy}
      />
      <ChangeStatusDialog
        open={dialog === 'status'}
        onClose={() => setDialog(null)}
        currentStatus={ticket.status}
        onSubmit={actions.changeStatus}
        isSubmitting={actions.isBusy}
      />
      <EscalateDialog open={dialog === 'escalate'} onClose={() => setDialog(null)} onSubmit={actions.escalate} isSubmitting={actions.isBusy} />
    </div>
  );
}
