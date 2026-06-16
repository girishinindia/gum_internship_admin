'use client';
import Link from 'next/link';
import { DataTable } from '@/components/ui/DataTable';

const STATUS_TONE: Record<string, string> = {
  open: 'bg-warning-50 text-warning-700',
  in_progress: 'bg-primary-50 text-primary-700',
  resolved: 'bg-success-50 text-success-700',
  closed: 'bg-neutral-100 text-neutral-500',
};
const PRIO_TONE: Record<string, string> = {
  low: 'bg-neutral-100 text-neutral-600',
  medium: 'bg-primary-50 text-primary-700',
  high: 'bg-warning-50 text-warning-700',
  urgent: 'bg-danger-50 text-danger-700',
};

export default function TicketsPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1">Support tickets</h1>
        <p className="text-body-sm text-neutral-600">Oldest first. Open a ticket to reply and change its status.</p>
      </div>
      <DataTable
        endpoint="/admin/tickets"
        filters={{ status: 'Status (open, in_progress…)' }}
        emptyText="No tickets — inbox zero 🎉"
        columns={[
          { key: 'ticket_no', label: 'Ticket', render: (r) => <Link href={`/tickets/${r.id}`} className="font-medium text-primary-700 hover:underline">{r.ticket_no}</Link> },
          { key: 'subject', label: 'Subject', render: (r) => <span className="line-clamp-1">{r.subject}</span> },
          { key: 'category', label: 'Category' },
          { key: 'requester', label: 'Requester' },
          { key: 'priority', label: 'Priority', render: (r) => <span className={`badge capitalize ${PRIO_TONE[r.priority] ?? 'bg-neutral-100'}`}>{r.priority}</span> },
          { key: 'status', label: 'Status', render: (r) => <span className={`badge capitalize ${STATUS_TONE[r.status] ?? 'bg-neutral-100'}`}>{String(r.status).replace('_', ' ')}</span> },
          { key: 'created_at', label: 'Opened', render: (r) => new Date(r.created_at).toLocaleDateString('en-IN') },
        ]}
        actions={(row) => <Link href={`/tickets/${row.id}`} className="btn-outline !h-8 px-3 text-body-sm">Open</Link>}
      />
    </div>
  );
}
