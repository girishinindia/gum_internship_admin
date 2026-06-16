'use client';
import { DataTable } from '@/components/ui/DataTable';

const fmt = (s: string): string => new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function AuditLogPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1">Audit log</h1>
        <p className="text-body-sm text-neutral-600">Every privileged mutation, newest first. Read-only.</p>
      </div>
      <DataTable
        endpoint="/admin/audit-logs"
        filters={{ action: 'Action contains…', entityType: 'Entity type (internship…)' }}
        emptyText="No audit entries match."
        columns={[
          { key: 'created_at', label: 'When', render: (r) => <span className="whitespace-nowrap text-neutral-600">{fmt(r.created_at)}</span> },
          { key: 'actor_name', label: 'Actor', render: (r) => r.actor_name ?? `#${r.actor_id ?? '—'}` },
          { key: 'action', label: 'Action', render: (r) => <span className="badge bg-primary-50 text-primary-700">{r.action}</span> },
          { key: 'entity', label: 'Entity', render: (r) => r.entity_type ? `${r.entity_type} #${r.entity_id ?? '—'}` : '—' },
          { key: 'ip_address', label: 'IP', render: (r) => <span className="text-caption text-neutral-500">{r.ip_address ?? '—'}</span> },
        ]}
      />
    </div>
  );
}
