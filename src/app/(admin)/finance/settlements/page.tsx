'use client';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuditMutation } from '@/hooks/useAuditMutation';
import { api } from '@/lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const STATUSES = ['', 'draft', 'approved', 'paid', 'failed'] as const;
const TONE: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  approved: 'bg-primary-50 text-primary-700',
  paid: 'bg-success-50 text-success-700',
  failed: 'bg-danger-50 text-danger-700',
};
const inr = (n: number): string => `₹${Number(n).toLocaleString('en-IN')}`;

export default function SettlementsPage(): JSX.Element {
  const { run, auditNotice } = useAuditMutation();
  const [status, setStatus] = useState('');
  const [nonce, setNonce] = useState(0);
  const [creating, setCreating] = useState(false);
  const endpoint = `/admin/settlements?${new URLSearchParams({ ...(status ? { status } : {}), _: String(nonce) }).toString()}`;
  const reloadAll = (): void => setNonce((n) => n + 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1">Settlements</h1>
          <p className="text-body-sm text-neutral-600">Instructor payouts. Create a settlement for a period, approve it, then mark it paid with a UTR.</p>
        </div>
        <button onClick={() => setCreating((v) => !v)} className="btn-primary px-4">{creating ? 'Close' : '+ New settlement'}</button>
      </div>

      {creating && <CreateSettlement onDone={() => { setCreating(false); reloadAll(); }} />}

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`badge capitalize ${status === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <DataTable
        endpoint={endpoint}
        emptyText="No settlements yet."
        columns={[
          { key: 'settlementNo', label: 'Settlement', render: (r) => <span className="font-medium">{r.settlementNo}</span> },
          { key: 'instructorName', label: 'Instructor' },
          { key: 'period', label: 'Period', render: (r) => `${r.periodStart} → ${r.periodEnd}` },
          { key: 'grossAmount', label: 'Gross', render: (r) => inr(r.grossAmount) },
          { key: 'tdsAmount', label: 'TDS', render: (r) => inr(r.tdsAmount) },
          { key: 'payableAmount', label: 'Payable', render: (r) => <span className="font-medium">{inr(r.payableAmount)}</span> },
          { key: 'status', label: 'Status', render: (r) => (
            <span className="flex items-center gap-1">
              <span className={`badge capitalize ${TONE[r.status] ?? 'bg-neutral-100'}`}>{r.status}</span>
              {r.utrNumber && <span className="text-caption text-neutral-500">{r.utrNumber}</span>}
            </span>
          ) },
        ]}
        actions={(row, reload) => {
          const after = (): void => { reload(); };
          if (row.status === 'draft') {
            return (
              <ConfirmDialog
                trigger={(open) => <button className="btn-primary !h-8 px-3 text-body-sm" onClick={open}>Approve</button>}
                title={`Approve ${row.settlementNo}?`}
                body={<p>Marks the payout as approved and ready to pay {inr(row.payableAmount)} to {row.instructorName}.</p>}
                confirmLabel="Approve" auditNotice={auditNotice}
                onConfirm={async () => { const ok = await run('PATCH', `/admin/settlements/${row.id}`, { status: 'approved' }, 'Approved'); if (ok) after(); return ok; }}
              />
            );
          }
          if (row.status === 'approved') {
            return (
              <ConfirmDialog
                trigger={(open) => <button className="btn-outline !h-8 px-3 text-body-sm" onClick={open}>Mark paid</button>}
                title={`Mark ${row.settlementNo} paid?`}
                confirmLabel="Mark paid" auditNotice={auditNotice}
                withReason={{ placeholder: 'Bank UTR / reference number…', templates: [] }}
                onConfirm={async (utr) => { const ok = await run('PATCH', `/admin/settlements/${row.id}`, { status: 'paid', utrNumber: utr }, 'Marked paid'); if (ok) after(); return ok; }}
              />
            );
          }
          return <span className="text-caption text-neutral-400">—</span>;
        }}
      />
    </div>
  );
}

function CreateSettlement({ onDone }: { onDone: () => void }): JSX.Element {
  const { run } = useAuditMutation();
  const [instructors, setInstructors] = useState<Any[]>([]);
  const [instructorProfileId, setInstructor] = useState('');
  const [periodStart, setStart] = useState('');
  const [periodEnd, setEnd] = useState('');
  const [tdsPercent, setTds] = useState('10');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { void api<Any[]>('/admin/instructors?limit=100').then((r) => setInstructors(r.data)).catch(() => setInstructors([])); }, []);

  const create = async (): Promise<void> => {
    if (!instructorProfileId || !periodStart || !periodEnd) return;
    setBusy(true);
    const ok = await run('POST', '/admin/settlements', {
      instructorProfileId: Number(instructorProfileId), periodStart, periodEnd,
      tdsPercent: Number(tdsPercent) || 0, notes: notes || undefined,
    }, 'Settlement created');
    setBusy(false);
    if (ok) onDone();
  };

  return (
    <div className="card grid items-end gap-3 p-4 sm:grid-cols-5">
      <div className="sm:col-span-2">
        <label className="mb-1 block text-caption font-medium text-neutral-700">Instructor</label>
        <select className="input" value={instructorProfileId} onChange={(e) => setInstructor(e.target.value)}>
          <option value="">Select…</option>
          {instructors.map((i) => <option key={i.id} value={i.id}>{i.name ?? `Profile #${i.id}`}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-caption font-medium text-neutral-700">Period start</label>
        <input className="input" type="date" value={periodStart} onChange={(e) => setStart(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-caption font-medium text-neutral-700">Period end</label>
        <input className="input" type="date" value={periodEnd} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-caption font-medium text-neutral-700">TDS %</label>
          <input className="input" type="number" min={0} max={30} value={tdsPercent} onChange={(e) => setTds(e.target.value)} />
        </div>
        <button onClick={create} disabled={busy || !instructorProfileId || !periodStart || !periodEnd} className="btn-primary px-4">{busy ? '…' : 'Create'}</button>
      </div>
      <input className="input sm:col-span-5" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </div>
  );
}
