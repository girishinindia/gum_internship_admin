'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const inr = (n: number): string => `₹${Number(n).toLocaleString('en-IN')}`;
const RANGES = [7, 30, 90] as const;

export default function AnalyticsPage(): JSX.Element {
  const [days, setDays] = useState<number>(30);
  const [d, setD] = useState<Any | null>(null);

  useEffect(() => {
    setD(null);
    void api<Any>(`/admin/analytics?days=${days}`).then((r) => setD(r.data)).catch(() => setD({ error: true }));
  }, [days]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1">Analytics</h1>
          <p className="text-body-sm text-neutral-600">Acquisition, activation and revenue trends.</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)} className={`badge ${days === r ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{r}d</button>
          ))}
        </div>
      </div>

      {!d ? <p className="text-neutral-500">Loading…</p> : d.error ? <p className="text-danger-700">Could not load analytics.</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat label="Signups" value={d.funnel.signups} />
            <Stat label="Enrollments" value={d.funnel.enrollments} />
            <Stat label="Paid orders" value={d.funnel.paidOrders} />
            <Stat label="Revenue" value={inr(d.funnel.revenue)} />
            <Stat label="Certificates" value={d.funnel.certificates} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Bars title="Signups / day" series={d.signupSeries as Any[]} color="bg-primary-500" />
            <Bars title="Enrollments / day" series={d.enrollSeries as Any[]} color="bg-success-500" />
          </div>

          <div className="card p-4">
            <p className="text-body-sm font-semibold text-neutral-700">Tracked events ({days}d)</p>
            {(d.events as Any[]).length === 0 ? <p className="mt-2 text-body-sm text-neutral-500">No events captured yet.</p> : (
              <div className="mt-2 divide-y divide-neutral-100">
                {(d.events as Any[]).map((e) => (
                  <div key={e.name} className="flex items-center justify-between py-1.5 text-body-sm">
                    <span className="font-mono text-neutral-600">{e.name}</span><span className="font-medium">{e.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }): JSX.Element {
  return (
    <div className="card p-4">
      <p className="text-caption uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-h2 text-neutral-900">{value}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Bars({ title, series, color }: { title: string; series: any[]; color: string }): JSX.Element {
  const max = Math.max(1, ...series.map((s) => Number(s.count)));
  return (
    <div className="card p-4">
      <p className="text-body-sm font-semibold text-neutral-700">{title}</p>
      {series.length === 0 ? <p className="mt-2 text-body-sm text-neutral-500">No data in this range.</p> : (
        <div className="mt-3 flex h-32 items-end gap-0.5">
          {series.map((s) => (
            <div key={String(s.day)} className="flex-1" title={`${new Date(s.day).toLocaleDateString('en-IN')}: ${s.count}`}>
              <div className={`${color} rounded-t`} style={{ height: `${Math.round((Number(s.count) / max) * 100)}%`, minHeight: '2px' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
