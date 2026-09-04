import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { Phone, Mail, Building2, User, Tag, CalendarClock, PhoneCall, Headphones } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { SourceBadge } from './TicketBadges';
import type { Ticket } from '@/types/ticket';

function Row({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-faint" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-text-faint">{label}</p>
        <p className="truncate text-sm text-text">{value}</p>
      </div>
    </div>
  );
}

export function TicketInfoGrid({ ticket, hideCustomerContact = false }: { ticket: Ticket; hideCustomerContact?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader title="Customer Information" />
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row icon={User} label="Name" value={ticket.customer.name} />
          {!hideCustomerContact && <Row icon={Phone} label="Phone" value={ticket.customer.phone} />}
          {!hideCustomerContact && ticket.customer.email && <Row icon={Mail} label="Email" value={ticket.customer.email} />}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ticket Information" />
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row icon={Tag} label="Category" value={[ticket.category, ticket.subCategory].filter(Boolean).join(' / ') || '—'} />
          <Row icon={Building2} label="Created By" value={ticket.createdByUserName} />
          <Row icon={CalendarClock} label="Created" value={format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')} />
          <Row icon={Headphones} label="Source" value={<SourceBadge source={ticket.source} />} />
        </CardBody>
      </Card>

      {ticket.callInfo && (
        <Card className="md:col-span-2">
          <CardHeader title="Phone Call" subtitle="This ticket originated from a PBX call" />
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Row icon={Phone} label="Caller Number" value={ticket.callInfo.callerNumber} />
            <Row icon={PhoneCall} label="Call ID" value={ticket.callInfo.callId} />
            <Row icon={CalendarClock} label="Call Start" value={format(new Date(ticket.callInfo.callStart), 'HH:mm:ss')} />
            <Row icon={CalendarClock} label="Call End" value={ticket.callInfo.callEnd ? format(new Date(ticket.callInfo.callEnd), 'HH:mm:ss') : '—'} />
            <Row icon={User} label="Agent" value={ticket.callInfo.agentName} />
            <Row icon={Tag} label="Extension" value={ticket.callInfo.extension ?? '—'} />
            {ticket.callInfo.recordingUrl && (
              <div className="col-span-2">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-text-faint">Recording</p>
                <a href={ticket.callInfo.recordingUrl} className="text-sm font-medium text-brand-600 hover:underline">
                  Play call recording
                </a>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card className="md:col-span-2">
        <CardHeader title="Description" />
        <CardBody>
          <p className="whitespace-pre-wrap text-sm text-text">{ticket.description}</p>
        </CardBody>
      </Card>
    </div>
  );
}
