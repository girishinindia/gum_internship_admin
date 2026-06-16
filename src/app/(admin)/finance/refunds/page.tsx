'use client';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuditMutation } from '@/hooks/useAuditMutation';

export default function RefundsQueuePage(): JSX.Element {
  const { run, auditNotice } = useAuditMutation();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1">Refund approvals</h1>
        <p className="text-body-sm text-neutral-600">Policy: full refund inside 7 days of purchase, before meaningful progress. Approval triggers the Razorpay refund, suspends the enrollment, releases the seat and reverses the instructor earning.</p>
      </div>
      <DataTable
        endpoint="/admin/refunds?status=requested"
        emptyText="No refunds waiting"
        columns={[
          { key: 'orderNo', label: 'Order', sortable: true },
          { key: 'userName', label: 'Student' },
          { key: 'amount', label: 'Amount (₹)', sortable: true, render: (r) => Number(r.amount).toLocaleString('en-IN') },
          { key: 'reason', label: 'Reason', render: (r) => <span className="line-clamp-2 max-w-72 text-neutral-700">{r.reason}</span> },
        ]}
        actions={(row, reload) => (
          <span className="flex justify-end gap-2">
            <ConfirmDialog
              trigger={(open) => <button className="btn-primary !h-8 px-3 text-body-sm" onClick={open}>Approve</button>}
              title={`Refund ₹${Number(row.amount).toLocaleString('en-IN')} on ${row.orderNo}?`}
              body={<p>Provider refund is initiated immediately; the student is notified once processed.</p>}
              confirmLabel="Approve refund" danger auditNotice={auditNotice}
              onConfirm={async () => {
                const ok = await run('POST', `/admin/refunds/${row.id}/decision`, { decision: 'approved' }, 'Refund approved');
                if (ok) reload();
                return ok;
              }}
            />
            <ConfirmDialog
              trigger={(open) => <button className="btn-outline !h-8 px-3 text-body-sm" onClick={open}>Reject</button>}
              title={`Reject refund for ${row.orderNo}?`} confirmLabel="Reject"
              withReason={{ placeholder: 'Reason shown to the student…', templates: ['Outside the 7-day refund window', 'Significant course progress already made', 'Duplicate request'] }}
              auditNotice={auditNotice}
              onConfirm={async (reason) => {
                const ok = await run('POST', `/admin/refunds/${row.id}/decision`, { decision: 'rejected', reason }, 'Refund rejected');
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
