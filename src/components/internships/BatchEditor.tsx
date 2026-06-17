'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const STATUS = ['scheduled', 'enrolling', 'ongoing', 'completed', 'cancelled'] as const;

/** Batch (cohort) manager. Batches come from the internship detail; mutations hit the batches API. */
export function BatchEditor({ internshipId, batches, reload }: {
  internshipId: number; batches: Any[]; reload: () => void;
}): JSX.Element {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [seatsTotal, setSeats] = useState('30');

  const SeatCell = ({ b, busy: cellBusy, onSave }: { b: Any; busy: boolean; onSave: (n: number) => void }): JSX.Element => {
    const filled = Number(b.seatsFilled ?? b.seatsTotal - b.seatsLeft);
    const [val, setVal] = useState(String(b.seatsTotal));
    const commit = (): void => {
      const n = Number(val);
      if (!Number.isInteger(n) || n === Number(b.seatsTotal)) { setVal(String(b.seatsTotal)); return; }
      if (n < Math.max(1, filled)) { toast('warning', `Seats can’t go below ${filled} already filled.`); setVal(String(b.seatsTotal)); return; }
      onSave(n);
    };
    return (
      <div className="flex items-center gap-2">
        <input type="number" min={Math.max(1, filled)} value={val} disabled={cellBusy}
          onChange={(e) => setVal(e.target.value)} onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className="input !h-8 !w-20 !py-0" aria-label="Total seats" />
        <span className="whitespace-nowrap text-caption text-neutral-400">{filled} filled</span>
      </div>
    );
  };

  const call = async (method: string, path: string, body?: unknown, ok?: string): Promise<void> => {
    setBusy(true);
    try {
      await api(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
      if (ok) toast('success', ok);
      reload();
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  };

  const add = async (): Promise<void> => {
    if (name.trim().length < 2 || !startDate || !endDate) { toast('warning', 'Name, start and end dates are required.'); return; }
    await call('POST', `/internships/${internshipId}/batches`, {
      name: name.trim(), startDate, endDate, seatsTotal: Number(seatsTotal) || 1, status: 'scheduled',
    }, 'Batch added');
    setName(''); setStart(''); setEnd(''); setSeats('30');
  };

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-caption uppercase text-neutral-600">
              <th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Dates</th>
              <th className="px-4 py-2.5">Seats</th><th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">No batches yet.</td></tr>}
            {batches.map((b) => (
              <tr key={b.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5 font-medium">{b.name}</td>
                <td className="px-4 py-2.5">{b.startDate} → {b.endDate}</td>
                <td className="px-4 py-2.5">
                  <SeatCell b={b} busy={busy} onSave={(seatsTotal) => call('PATCH', `/batches/${b.id}`, { seatsTotal }, 'Seats updated')} />
                </td>
                <td className="px-4 py-2.5">
                  <select className="input !h-8 !py-0" value={b.status} disabled={busy}
                    onChange={(e) => call('PATCH', `/batches/${b.id}`, { status: e.target.value }, 'Batch updated')}>
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card grid items-end gap-3 p-4 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-caption font-medium text-neutral-700">Batch name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="July 2026 Cohort" />
        </div>
        <div>
          <label className="mb-1 block text-caption font-medium text-neutral-700">Start</label>
          <input className="input" type="date" value={startDate} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-caption font-medium text-neutral-700">End</label>
          <input className="input" type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-caption font-medium text-neutral-700">Seats</label>
            <input className="input" type="number" min={1} value={seatsTotal} onChange={(e) => setSeats(e.target.value)} />
          </div>
          <button onClick={add} disabled={busy} className="btn-primary px-4">Add</button>
        </div>
      </div>
    </div>
  );
}
