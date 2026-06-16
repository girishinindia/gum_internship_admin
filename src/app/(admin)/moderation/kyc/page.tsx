'use client';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuditMutation } from '@/hooks/useAuditMutation';

const REJECT_TEMPLATES = [
  'PAN details do not match the registered name',
  'Bank account could not be verified',
  'Incomplete KYC documents — please re-upload and re-apply',
];

export default function KycQueuePage(): JSX.Element {
  const { run, auditNotice } = useAuditMutation();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1">Instructor KYC queue</h1>
        <p className="text-body-sm text-neutral-600">Oldest applications first. Approval grants the instructor role and sends the agreement.</p>
      </div>
      <DataTable
        endpoint="/admin/instructors?kycStatus=submitted"
        emptyText="No applications waiting — clean queue 🎉"
        columns={[
          { key: 'name', label: 'Applicant', sortable: true, render: (r) => (
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-caption text-neutral-500">{r.email}</p>
            </div>
          ) },
          { key: 'expertise', label: 'Expertise', render: (r) => (r.expertise as string[]).join(', ') },
          { key: 'bankLast4', label: 'Bank', render: (r) => `••••${r.bankLast4 ?? '—'} · ${r.bankIfsc ?? ''}` },
          { key: 'kycDocuments', label: 'Documents', render: (r) => {
            const docs = (r.kycDocuments ?? []) as { type: string; bunnyPath: string }[];
            return docs.length === 0 ? <span className="text-neutral-400">none</span> : (
              <span className="flex flex-wrap gap-1">
                {docs.map((d) => <span key={d.bunnyPath} className="badge bg-neutral-100 text-neutral-700" title={d.bunnyPath}>{d.type}</span>)}
              </span>
            );
          } },
          { key: 'appliedAt', label: 'Applied', sortable: true, render: (r) => new Date(r.appliedAt).toLocaleDateString('en-IN') },
        ]}
        actions={(row, reload) => (
          <span className="flex justify-end gap-2">
            <ConfirmDialog
              trigger={(open) => <button className="btn-primary !h-8 px-3 text-body-sm" onClick={open}>Approve</button>}
              title={`Approve ${row.name} as instructor?`}
              body={<p>Grants the <strong>instructor</strong> role, marks the agreement as sent, and sets the revenue share (default 70%).</p>}
              confirmLabel="Approve"
              auditNotice={auditNotice}
              onConfirm={async () => {
                const ok = await run('POST', `/admin/instructors/${row.id}/kyc-decision`, { decision: 'approved' }, `${row.name} approved`);
                if (ok) reload();
                return ok;
              }}
            />
            <ConfirmDialog
              trigger={(open) => <button className="btn-outline !h-8 px-3 text-body-sm !text-danger-700" onClick={open}>Reject</button>}
              title={`Reject ${row.name}'s application?`}
              confirmLabel="Reject"
              danger
              withReason={{ placeholder: 'Reason shown to the applicant…', templates: REJECT_TEMPLATES }}
              auditNotice={auditNotice}
              onConfirm={async (reason) => {
                const ok = await run('POST', `/admin/instructors/${row.id}/kyc-decision`, { decision: 'rejected', reason }, 'Application rejected');
                if (ok) reload();
                return ok;
              }}
            />
          </span>
        )}
      />
    </div>
  );
}
