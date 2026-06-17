'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const STATUSES = ['', 'active', 'scheduled', 'expired', 'used_up', 'inactive'] as const;
const TONE: Record<string, string> = {
  active: 'bg-success-50 text-success-700',
  scheduled: 'bg-primary-50 text-primary-700',
  expired: 'bg-danger-50 text-danger-700',
  used_up: 'bg-warning-50 text-warning-700',
  inactive: 'bg-neutral-100 text-neutral-500',
};
const inr = (n: number): string => `₹${Number(n).toLocaleString('en-IN')}`;
const fmt = (s: string | null): string => (s ? new Date(s).toLocaleDateString('en-IN') : '—');

export default function CouponsPage(): JSX.Element {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<Any[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setRows(null);
    try { const { data } = await api<Any[]>(`/admin/coupons${status ? `?status=${status}` : ''}`); setRows(data); }
    catch { setRows([]); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);

  const patch = async (id: number, body: Any, msg: string): Promise<void> => {
    try { await api(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); toast('success', msg); void load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not update.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1">Coupons</h1>
          <p className="text-body-sm text-neutral-600">Discount codes for paid checkout. Expire by setting an end date or deactivating.</p>
        </div>
        <button onClick={() => setCreating((v) => !v)} className="btn-primary px-4">{creating ? 'Close' : '+ New coupon'}</button>
      </div>

      {creating && <CreateCoupon onDone={() => { setCreating(false); void load(); }} />}

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`badge capitalize ${status === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-body-sm">
          <thead><tr className="bg-neutral-50 text-left text-caption uppercase text-neutral-600">
            <th className="px-4 py-2.5">Code</th><th className="px-4 py-2.5">Discount</th><th className="px-4 py-2.5">Scope</th>
            <th className="px-4 py-2.5">Valid until</th><th className="px-4 py-2.5">Used</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {!rows ? <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500">Loading…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-500">No coupons.</td></tr>
            : rows.flatMap((c) => [
              <tr key={c.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-2.5">{c.discountType === 'percent' ? `${c.discountValue}%` : inr(c.discountValue)}{c.maxDiscountAmount ? ` (max ${inr(c.maxDiscountAmount)})` : ''}</td>
                <td className="px-4 py-2.5">{c.internshipTitle ?? 'All internships'}</td>
                <td className="px-4 py-2.5">{fmt(c.validUntil)}</td>
                <td className="px-4 py-2.5">
                  <div>{c.redemptionCount}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ' used'}</div>
                  <div className="text-caption text-neutral-400">max {c.perUserLimit}/user</div>
                </td>
                <td className="px-4 py-2.5"><span className={`badge capitalize ${TONE[c.status] ?? 'bg-neutral-100'}`}>{String(c.status).replace('_', ' ')}</span></td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing((id) => (id === c.id ? null : c.id))} className="btn-outline !h-8 px-3 text-body-sm">{editing === c.id ? 'Close' : 'Edit'}</button>
                    {c.isActive
                      ? <button onClick={() => patch(c.id, { isActive: false }, 'Coupon deactivated')} className="btn-outline !h-8 px-3 text-body-sm !text-danger-700">Expire</button>
                      : <button onClick={() => patch(c.id, { isActive: true }, 'Coupon activated')} className="btn-outline !h-8 px-3 text-body-sm">Activate</button>}
                  </div>
                </td>
              </tr>,
              editing === c.id && (
                <tr key={`${c.id}-edit`} className="border-t border-neutral-100 bg-neutral-50/60">
                  <td colSpan={7} className="px-4 py-4">
                    <EditCoupon c={c} onSave={(body) => patch(c.id, body, 'Coupon updated').then(() => setEditing(null))} />
                  </td>
                </tr>
              ),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateCoupon({ onDone }: { onDone: () => void }): JSX.Element {
  const toast = useToast();
  const [f, setF] = useState({ code: '', discountType: 'percent', discountValue: '', maxDiscountAmount: '', validUntil: '', maxRedemptions: '', perUserLimit: '1', minOrderAmount: '0' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string): void => setF((p) => ({ ...p, [k]: v }));

  const submit = async (): Promise<void> => {
    if (f.code.trim().length < 3 || !f.discountValue) { toast('warning', 'Code and discount value are required.'); return; }
    setBusy(true);
    try {
      await api('/admin/coupons', { method: 'POST', body: JSON.stringify({
        code: f.code.trim(), discountType: f.discountType, discountValue: Number(f.discountValue),
        ...(f.maxDiscountAmount ? { maxDiscountAmount: Number(f.maxDiscountAmount) } : {}),
        ...(f.validUntil ? { validUntil: new Date(`${f.validUntil}T23:59:59Z`).toISOString() } : {}),
        ...(f.maxRedemptions ? { maxRedemptions: Number(f.maxRedemptions) } : {}),
        perUserLimit: Number(f.perUserLimit) || 1,
        minOrderAmount: Number(f.minOrderAmount) || 0,
      }) });
      toast('success', 'Coupon created.'); onDone();
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not create coupon.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="card grid items-end gap-3 p-4 sm:grid-cols-4">
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Code</span>
        <input className="input font-mono" value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="EARLYBIRD25" /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Type</span>
        <select className="input" value={f.discountType} onChange={(e) => set('discountType', e.target.value)}><option value="percent">percent</option><option value="flat">flat (₹)</option></select></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Value</span>
        <input className="input" type="number" min={0} value={f.discountValue} onChange={(e) => set('discountValue', e.target.value)} placeholder={f.discountType === 'percent' ? '25' : '500'} /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Max discount (₹)</span>
        <input className="input" type="number" min={0} value={f.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value)} placeholder="optional" /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Valid until</span>
        <input className="input" type="date" value={f.validUntil} onChange={(e) => set('validUntil', e.target.value)} /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Max redemptions</span>
        <input className="input" type="number" min={1} value={f.maxRedemptions} onChange={(e) => set('maxRedemptions', e.target.value)} placeholder="optional" /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Per-user limit</span>
        <input className="input" type="number" min={1} value={f.perUserLimit} onChange={(e) => set('perUserLimit', e.target.value)} /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Min order (₹)</span>
        <input className="input" type="number" min={0} value={f.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} /></label>
      <button onClick={submit} disabled={busy} className="btn-primary px-4">{busy ? '…' : 'Create coupon'}</button>
    </div>
  );
}

/** Inline edit for an existing coupon. Code/discount are immutable; everything
 *  else (validity, caps, per-user limit, min order, active) is patchable. */
function EditCoupon({ c, onSave }: { c: Any; onSave: (body: Any) => void }): JSX.Element {
  const toDateInput = (s: string | null): string => (s ? new Date(s).toISOString().slice(0, 10) : '');
  const [f, setF] = useState({
    description: c.description ?? '',
    validUntil: toDateInput(c.validUntil),
    maxRedemptions: c.maxRedemptions != null ? String(c.maxRedemptions) : '',
    perUserLimit: String(c.perUserLimit ?? 1),
    minOrderAmount: String(c.minOrderAmount ?? 0),
    isActive: Boolean(c.isActive),
  });
  const set = (k: keyof typeof f, v: string | boolean): void => setF((p) => ({ ...p, [k]: v }));

  const save = (): void => {
    onSave({
      description: f.description,
      validUntil: f.validUntil ? new Date(`${f.validUntil}T23:59:59Z`).toISOString() : null,
      maxRedemptions: f.maxRedemptions ? Number(f.maxRedemptions) : null,
      perUserLimit: Number(f.perUserLimit) || 1,
      minOrderAmount: Number(f.minOrderAmount) || 0,
      isActive: f.isActive,
    });
  };

  return (
    <div className="grid items-end gap-3 sm:grid-cols-5">
      <label className="block sm:col-span-2"><span className="mb-1 block text-caption font-medium text-neutral-700">Description</span>
        <input className="input" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Internal note" /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Valid until</span>
        <input className="input" type="date" value={f.validUntil} onChange={(e) => set('validUntil', e.target.value)} /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Max redemptions</span>
        <input className="input" type="number" min={1} value={f.maxRedemptions} onChange={(e) => set('maxRedemptions', e.target.value)} placeholder="∞" /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Per-user limit</span>
        <input className="input" type="number" min={1} value={f.perUserLimit} onChange={(e) => set('perUserLimit', e.target.value)} /></label>
      <label className="block"><span className="mb-1 block text-caption font-medium text-neutral-700">Min order (₹)</span>
        <input className="input" type="number" min={0} value={f.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} /></label>
      <label className="flex items-center gap-2 text-body-sm">
        <input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active
      </label>
      <button onClick={save} className="btn-primary px-4">Save changes</button>
    </div>
  );
}
