import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldShell, Input, Select, Textarea } from '@/components/ui/Field';
import { ticketsApi } from '@/services/api/ticketsApi';
import { TicketPriority, TicketSource } from '@/types/ticket';
import { PRIORITY_META, PRIORITY_ORDER } from '@/constants/ticketMeta';
import { notifyError, notifySuccess } from '@/store/uiStore';
import { ApiError } from '@/types/api';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  subject: z.string().min(4, 'Subject must be at least 4 characters'),
  description: z.string().min(10, 'Please describe the issue in more detail'),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  requestedPriority: z.nativeEnum(TicketPriority),
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().min(6, 'Phone number is required'),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  source: z.nativeEnum(TicketSource),
});
type FormValues = z.infer<typeof schema>;

export function TicketCreateForm({ context, onCreated }: { context: 'customer' | 'customer-care'; onCreated: (ticketId: string) => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: '',
      description: '',
      category: '',
      subCategory: '',
      requestedPriority: TicketPriority.Normal,
      customerName: context === 'customer' ? (user?.name ?? '') : '',
      customerPhone: '',
      customerEmail: context === 'customer' ? (user?.email ?? '') : '',
      source: context === 'customer' ? TicketSource.CustomerPortal : TicketSource.CustomerCare,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      ticketsApi.create({
        subject: values.subject,
        description: values.description,
        category: values.category || undefined,
        subCategory: values.subCategory || undefined,
        requestedPriority: values.requestedPriority,
        source: values.source,
        customer: { name: values.customerName, phone: values.customerPhone, email: values.customerEmail || undefined },
      }),
    onSuccess: (ticket) => {
      notifySuccess(`Ticket created successfully — Ticket number: ${ticket.number}`);
      onCreated(ticket.id);
    },
    onError: (error) => notifyError(error instanceof ApiError ? error.message : 'Could not create the ticket.'),
  });

  return (
    <Card>
      <CardHeader title="New Ticket" subtitle="Provide as much detail as possible to help us route this correctly" />
      <CardBody>
        <form onSubmit={handleSubmit((values) => createMutation.mutate(values))} className="flex flex-col gap-4" noValidate>
          <FieldShell label="Subject" htmlFor="subject" error={errors.subject?.message} required>
            <Input id="subject" {...register('subject')} />
          </FieldShell>

          <FieldShell label="Description" htmlFor="description" error={errors.description?.message} required>
            <Textarea id="description" rows={5} {...register('description')} />
          </FieldShell>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldShell label="Category" htmlFor="category">
              <Input id="category" placeholder="e.g. Connectivity, Billing" {...register('category')} />
            </FieldShell>
            <FieldShell label="Subcategory" htmlFor="subCategory">
              <Input id="subCategory" placeholder="e.g. VPN, Invoice" {...register('subCategory')} />
            </FieldShell>
          </div>

          <FieldShell
            label="Requested Priority"
            htmlFor="requestedPriority"
            hint="This is the urgency you are requesting - our team may adjust the final priority."
          >
            <Select id="requestedPriority" {...register('requestedPriority')}>
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </FieldShell>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-faint">Contact Information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldShell label="Full Name" htmlFor="customerName" error={errors.customerName?.message} required>
                <Input id="customerName" disabled={context === 'customer'} {...register('customerName')} />
              </FieldShell>
              <FieldShell label="Phone" htmlFor="customerPhone" error={errors.customerPhone?.message} required>
                <Input id="customerPhone" {...register('customerPhone')} />
              </FieldShell>
              <FieldShell label="Email" htmlFor="customerEmail" error={errors.customerEmail?.message}>
                <Input id="customerEmail" type="email" disabled={context === 'customer'} {...register('customerEmail')} />
              </FieldShell>
              {context === 'customer-care' && (
                <FieldShell label="Source" htmlFor="source">
                  <Select id="source" {...register('source')}>
                    <option value={TicketSource.CustomerCare}>Customer Care (manual entry)</option>
                    <option value={TicketSource.PhoneCall}>Phone Call</option>
                    <option value={TicketSource.Email}>Email</option>
                  </Select>
                </FieldShell>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Ticket
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
