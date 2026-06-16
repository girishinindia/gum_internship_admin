'use client';
import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { useAuditMutation } from '@/hooks/useAuditMutation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const STATUSES = ['', 'pending_payment', 'waitlisted', 'active', 'completed', 'dropped', 'suspended'] as const;
const TONE: Record<string, string> = {
  pending_payment: 'bg-warning-50 text-warning-700',
  waitlisted: 'bg-primary-50 text-primary-700',
  active: 'bg-success-50 text-success-700',
  completed: 'bg-primary-50 text-primary-700',
  dropped: 'bg-neutral-100 text-neutral-500',
  suspended: 'bg-danger-50 text-danger-700',
};

export default function EnrollmentOpsPage(): JSX.Element {
  const { run } = useAuditMutation();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [nonce, setNonce] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const endpoint = `/admin/enrollments?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), _: String(nonce) }).toString()}`;
  const reloadAll = (): void => setNonce((n) => n + 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1">Enrollment ops</h1>
          <p className="text-body-sm text-neutral-600">Browse enrolments, enrol a learner manually, or transfer them between batches.</p>
        </div>
        <button onClick={() => setEnrolling((v) => !v)} className="btn-primary px-4">{enrolling ? 'Close' : '+ Manual enroll'}</button>
      </div>

      {enrolling && <ManualEnroll run={run} onDone={() => { setEnrolling(false); reloadAll(); }} />}

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`badge capitalize ${status === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
        <input className="input !h-9 ml-auto max-w-64" placeholder="Search learner name / email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <DataTable
        endpoint={endpoint}
        emptyText="No enrolments match."
        columns={[
          { key: 'userName', label: 'Learner', render: (r) => (
            <div><p className="font-medium">{r.userName}</p><p className="text-caption text-neutral-500">{r.userEmail}</p></div>
          ) },
          { key: 'internshipTitle', label: 'Internship', render: (r) => <span className="line-clamp-1">{r.internshipTitle}</span> },
          { key: 'batchName', label: 'Batch', render: (r) => r.batchName ?? '—' },
          { key: 'status', label: 'Status', render: (r) => <span className={`badge capitalize ${TONE[r.status] ?? 'bg-neutral-100'}`}>{String(r.status).replace('_', ' ')}</span> },
          { key: 'progressPercent', label: 'Progress', render: (r) => `${Math.round(r.progressPercent)}%` },
          { key: 'enrolledAt', label: 'Enrolled', render: (r) => r.enrolledAt ? new Date(r.enrolledAt).toLocaleDateString('en-IN') : '—' },
        ]}
        actions={(row, reload) => (
          ['active', 'waitlisted'].includes(row.status)
            ? <TransferButton row={row} run={run} reload={reload} />
            : <span className="text-caption text-neutral-400">—</span>
        )}
      />
    </div>
  );
}

type Run = (method: string, path: string, body?: unknown, msg?: string) => Promise<boolean>;

function ManualEnroll({ run, onDone }: { run: Run; onDone: () => void }): JSX.Element {
  const [userId, setUserId] = useState('');
  const [internshipId, setInternshipId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (): Promise<void> => {
    if (!userId || !internshipId) return;
    setBusy(true);
    const ok = await run('POST', '/admin/enrollments/manual', {
      userId: Number(userId), internshipId: Number(internshipId), ...(batchId ? { batchId: Number(batchId) } : {}),
    }, 'Learner enrolled');
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <div className="card grid items-end gap-3 p-4 sm:grid-cols-4">
      <div>
        <label className="mb-1 block text-caption font-medium text-neutral-700">User ID</label>
        <input className="input" type="number" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="e.g. 42" />
      </div>
      <div>
        <label className="mb-1 block text-caption font-medium text-neutral-700">Internship ID</label>
        <input className="input" type="number" value={internshipId} onChange={(e) => setInternshipId(e.target.value)} placeholder="e.g. 7" />
      </div>
      <div>
        <label className="mb-1 block text-caption font-medium text-neutral-700">Batch ID (optional)</label>
        <input className="input" type="number" value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="self-paced → blank" />
      </div>
      <button onClick={submit} disabled={busy || !userId || !internshipId} className="btn-primary px-4">{busy ? '…' : 'Enroll'}</button>
    </div>
  );
}

function TransferButton({ row, run, reload }: { row: Any; run: Run; reload: () => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [toBatchId, setToBatchId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (): Promise<void> => {
    if (!toBatchId || reason.trim().length < 3) return;
    setBusy(true);
    const ok = await run('POST', `/admin/enrollments/${row.id}/transfer`, { toBatchId: Number(toBatchId), reason: reason.trim() }, 'Transferred');
    setBusy(false);
    if (ok) { setOpen(false); reload(); }
  };
  return (
    <>
      <button className="btn-outline !h-8 px-3 text-body-sm" onClick={() => { setToBatchId(''); setReason(''); setOpen(true); }}>Transfer</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4" role="dialog" aria-modal>
          <div className="card w-full max-w-md space-y-3 p-5 text-left">
            <h3 className="text-h3">Transfer {row.userName}</h3>
            <p className="text-body-sm text-neutral-600">Move to a different batch of the same internship.</p>
            <div>
              <label className="mb-1 block text-caption font-medium text-neutral-700">Target batch ID</label>
              <input className="input" type="number" value={toBatchId} onChange={(e) => setToBatchId(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-caption font-medium text-neutral-700">Reason</label>
              <textarea className="input min-h-20 py-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this learner being moved?" />
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-outline px-4" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-primary px-4" onClick={submit} disabled={busy || !toBatchId || reason.trim().length < 3}>{busy ? '…' : 'Transfer'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
