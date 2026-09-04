import { UserMinus, Users } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { AssignmentTypeBadge } from './TicketBadges';
import { AssignmentType, type TicketAssignment } from '@/types/ticket';

export function AssignmentPanel({
  assignment,
  canManage,
  onAssignClick,
  onUnassign,
  onRemoveMember,
}: {
  assignment: TicketAssignment | null | undefined;
  canManage: boolean;
  onAssignClick: () => void;
  onUnassign: () => void;
  onRemoveMember: (employeeId: string) => void;
}) {
  const isActive = assignment?.isActive;

  return (
    <Card>
      <CardHeader
        title="Assignment"
        subtitle={isActive ? `${assignment!.departmentName} · assigned by ${assignment!.assignedByUserName}` : 'Not yet assigned to an employee'}
        actions={
          canManage && (
            <div className="flex gap-2">
              <Button size="sm" variant={isActive ? 'outline' : 'primary'} onClick={onAssignClick}>
                {isActive ? 'Reassign' : 'Assign'}
              </Button>
              {isActive && (
                <Button size="sm" variant="ghost" onClick={onUnassign}>
                  Unassign
                </Button>
              )}
            </div>
          )
        }
      />
      <CardBody>
        {!isActive ? (
          <p className="text-sm text-text-muted">This ticket is waiting in the department queue for an assignment.</p>
        ) : assignment!.assignmentType === AssignmentType.EntireDepartment ? (
          <div className="flex items-center gap-2 text-sm text-text">
            <Users className="h-4 w-4 text-text-faint" />
            Assigned to the entire {assignment!.departmentName} team
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {assignment!.members
              .filter((m) => m.isActive)
              .map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                  <span className="flex items-center gap-2">
                    <Avatar name={m.userName} size="sm" />
                    <span className="text-sm text-text">{m.userName}</span>
                  </span>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(m.userId)}
                      className="rounded p-1 text-text-faint hover:bg-danger-50 hover:text-danger-500"
                      aria-label={`Remove ${m.userName}`}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
          </ul>
        )}
        {isActive && assignment!.assignmentType !== AssignmentType.EntireDepartment && (
          <div className="mt-3">
            <AssignmentTypeBadge type={assignment!.assignmentType} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
