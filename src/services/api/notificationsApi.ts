import type { Notification } from '@/types/domain';
import { delay } from '@/services/mock/helpers';
import { useAuthStore } from '@/store/authStore';
import * as db from '@/services/mock/db';
import { isUserInvolvedInTicket } from '@/services/mock/db';
import { TimelineEventType } from '@/types/ticket';

const readIds = new Set<string>();

const NOTIFIABLE_TYPES = new Set<string>([
  TimelineEventType.Assigned,
  TimelineEventType.AssignmentChanged,
  TimelineEventType.Transferred,
  TimelineEventType.DepartmentReceived,
  TimelineEventType.CollaborationRequested,
  TimelineEventType.CollaborationResponded,
  TimelineEventType.Escalated,
  TimelineEventType.CustomerResponded,
]);

/**
 * Real-time delivery is intentionally out of scope for this pass; the spec
 * (section 36) allows polling until SignalR is wired up on the backend - see
 * /docs/api/frontend-requirements.md ("Notifications endpoint / SignalR hub").
 * This mock derives a plausible feed from ticket timelines relevant to the
 * signed-in user instead of persisting a separate notifications table.
 */
export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const user = useAuthStore.getState().user;
    if (!user) return delay([]);

    const relevant: Notification[] = [];
    for (const t of db.queryTickets({})) {
      const involvement = isUserInvolvedInTicket(t, user);
      const isMyDepartment = t.currentDepartmentId === user.departmentId;
      for (const e of t.timeline) {
        if (!NOTIFIABLE_TYPES.has(e.type)) continue;
        const relevantToUser =
          involvement !== null ||
          (isMyDepartment && (e.type === TimelineEventType.DepartmentReceived || e.type === TimelineEventType.Transferred)) ||
          (user.role === 'CustomerCare' && e.type === TimelineEventType.CustomerResponded);
        if (!relevantToUser) continue;
        relevant.push({
          id: e.id,
          title: e.summary,
          message: `${t.number} • ${t.subject}`,
          ticketId: t.id,
          ticketNumber: t.number,
          createdAt: e.occurredAt,
          readAt: readIds.has(e.id) ? new Date().toISOString() : null,
        });
      }
    }
    relevant.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return delay(relevant.slice(0, 30), 250);
  },

  async markRead(id: string): Promise<void> {
    readIds.add(id);
    return delay(undefined, 100);
  },

  async markAllRead(ids: string[]): Promise<void> {
    ids.forEach((id) => readIds.add(id));
    return delay(undefined, 150);
  },
};
