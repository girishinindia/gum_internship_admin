'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const fmt = (s: string): string => new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function TicketThreadPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const tid = Number(id);
  const toast = useToast();
  const [t, setT] = useState<Any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try { const { data } = await api<Any>(`/tickets/${tid}`); setT(data); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not load this ticket.'); }
  }, [tid]);
  useEffect(() => { void load(); }, [load]);

  const patch = async (body: Any, msg: string): Promise<void> => {
    try { await api(`/admin/tickets/${tid}`, { method: 'PATCH', body: JSON.stringify(body) }); toast('success', msg); await load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not update.'); }
  };
  const send = async (): Promise<void> => {
    if (reply.trim().length < 2) return; setBusy(true);
    try { await api(`/tickets/${tid}/replies`, { method: 'POST', body: JSON.stringify({ body: reply.trim() }) }); setReply(''); await load(); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not reply.'); }
    finally { setBusy(false); }
  };

  if (err) return <p className="text-danger-700">{err}</p>;
  if (!t) return <p className="text-neutral-500">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/tickets" className="text-body-sm text-primary-700 hover:underline">‹ Support tickets</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1">{t.subject}</h1>
          <p className="text-body-sm text-neutral-500">{t.ticketNo} · {t.category} · opened {fmt(t.createdAt)}</p>
        </div>
      </div>

      <div className="card flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="mb-1 block text-caption font-medium text-neutral-700">Status</label>
          <select className="input !h-9" value={t.status} onChange={(e) => patch({ status: e.target.value }, 'Status updated')}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-caption font-medium text-neutral-700">Priority</label>
          <select className="input !h-9" value={t.priority} onChange={(e) => patch({ priority: e.target.value }, 'Priority updated')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <p className="ml-auto self-center text-caption text-neutral-500">Updates are written to the audit log.</p>
      </div>

      <div className="card p-4">
        <p className="text-caption font-semibold uppercase text-neutral-500">Original request</p>
        <p className="mt-1 whitespace-pre-line text-body-sm text-neutral-800">{t.description}</p>
      </div>

      <div className="space-y-2">
        {(t.replies as Any[]).length === 0 && <p className="text-body-sm text-neutral-500">No replies yet.</p>}
        {(t.replies as Any[]).map((r) => (
          <div key={r.id} className="card p-3">
            <p className="text-caption text-neutral-500">{r.author} · {fmt(r.createdAt)}</p>
            <p className="mt-1 whitespace-pre-line text-body-sm text-neutral-800">{r.body}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <textarea className="input min-h-[90px] py-2" placeholder="Write a reply to the requester…" value={reply} onChange={(e) => setReply(e.target.value)} maxLength={5000} />
        <div className="mt-2 flex justify-end">
          <button onClick={send} disabled={busy || reply.trim().length < 2} className="btn-primary px-5">{busy ? 'Sending…' : 'Send reply'}</button>
        </div>
      </div>
    </div>
  );
}
