'use client';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuditMutation } from '@/hooks/useAuditMutation';

export default function UsersPage(): JSX.Element {
  const { run, auditNotice } = useAuditMutation();
  return (
    <div className="space-y-4">
      <h1 className="text-h1">Users</h1>
      <DataTable
        endpoint="/admin/users"
        filters={{ q: 'Search name / email / phone…', role: 'Role (student, instructor…)', status: 'Status (active…)' }}
        csvPath="/admin/exports/users"
        columns={[
          { key: 'fullName', label: 'Name', sortable: true, render: (r) => (
            <div>
              <p className="font-medium">{r.fullName}</p>
              <p className="text-caption text-neutral-500">{r.email ?? r.phone}</p>
            </div>
          ) },
          { key: 'roles', label: 'Roles', render: (r) => (
            <span className="flex flex-wrap gap-1">{(r.roles as string[]).map((x) => <span key={x} className="badge bg-neutral-100 text-neutral-700">{x}</span>)}</span>
          ) },
          { key: 'status', label: 'Status', sortable: true, render: (r) => (
            <span className={`badge ${r.status === 'active' ? 'bg-success-50 text-success-700' : r.status === 'suspended' ? 'bg-danger-50 text-danger-700' : 'bg-neutral-100 text-neutral-700'}`}>{r.status}</span>
          ) },
          { key: 'createdAt', label: 'Joined', sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
        ]}
        actions={(row, reload) => {
          const suspended = row.status === 'suspended';
          return (
            <ConfirmDialog
              trigger={(open) => (
                <button className={`btn-outline !h-8 px-3 text-body-sm ${suspended ? '' : '!text-danger-700'}`} onClick={open}>
                  {suspended ? 'Restore' : 'Suspend'}
                </button>
              )}
              title={`${suspended ? 'Restore' : 'Suspend'} ${row.fullName}?`}
              body={suspended ? undefined : <p>Suspension revokes every active session immediately.</p>}
              confirmLabel={suspended ? 'Restore' : 'Suspend'} danger={!suspended}
              withReason={suspended ? undefined : { placeholder: 'Reason…', templates: ['Payment fraud investigation', 'Abusive behaviour', 'Account compromise suspected'] }}
              auditNotice={auditNotice}
              onConfirm={async (reason) => {
                const ok = await run('PATCH', `/admin/users/${row.id}/status`, { status: suspended ? 'active' : 'suspended', reason }, 'Updated');
                if (ok) reload();
                return ok;
              }}
            />
          );
        }}
      />
    </div>
  );
}
