'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const STATUSES = ['', 'approved', 'submitted', 'pending', 'rejected'] as const;
const TONE: Record<string, string> = {
  approved: 'bg-success-50 text-success-700',
  submitted: 'bg-primary-50 text-primary-700',
  pending: 'bg-neutral-100 text-neutral-600',
  rejected: 'bg-danger-50 text-danger-700',
};
const inr = (n: number): string => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function InstructorsPage(): JSX.Element {
  const toast = useToast();
  const [kyc, setKyc] = useState('approved');
  const [rows, setRows] = useState<Any[] | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setRows(null);
    try {
      const { data } = await api<Any[]>(`/admin/instructors?limit=100${kyc ? `&kycStatus=${kyc}` : ''}`);
      setRows(data);
    } catch {
      setRows([]);
      toast('danger', 'Could not load instructors.');
    }
  }, [kyc, toast]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1">Instructors</h1>
        <p className="text-body-sm text-neutral-600">All instructor profiles, their programs and earnings. Approve new applicants under Instructor KYC.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button key={s || 'all'} onClick={() => setKyc(s)}
            className={`badge capitalize ${kyc === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead><tr className="bg-neutral-50 text-left text-caption uppercase text-neutral-600">
            <th className="px-4 py-2.5">Instructor</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">KYC</th>
            <th className="px-4 py-2.5 text-right">Programs</th><th className="px-4 py-2.5 text-right">Share</th>
            <th className="px-4 py-2.5 text-right">Lifetime</th><th className="px-4 py-2.5 text-right">Available</th><th className="px-4 py-2.5 text-right">Settled</th>
          </tr></thead>
          <tbody>
            {!rows ? <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500">Loading…</td></tr>
            : rows.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500">No instructors in this view.</td></tr>
            : rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-caption text-neutral-500">{r.email}</div>
                </td>
                <td className="px-4 py-2.5 capitalize">{r.instructorType}</td>
                <td className="px-4 py-2.5"><span className={`badge capitalize ${TONE[r.kycStatus] ?? 'bg-neutral-100'}`}>{r.kycStatus}</span></td>
                <td className="px-4 py-2.5 text-right">{r.internshipCount ?? 0}</td>
                <td className="px-4 py-2.5 text-right">{r.revenueSharePercent != null ? `${r.revenueSharePercent}%` : '—'}</td>
                <td className="px-4 py-2.5 text-right">{inr(r.lifetimeEarned)}</td>
                <td className="px-4 py-2.5 text-right text-success-700">{inr(r.availableEarnings)}</td>
                <td className="px-4 py-2.5 text-right text-neutral-500">{inr(r.settledEarnings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
