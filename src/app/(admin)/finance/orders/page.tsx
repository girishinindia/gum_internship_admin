'use client';
import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';

const STATUSES = ['', 'created', 'pending', 'paid', 'failed', 'refunded', 'cancelled'] as const;
const TONE: Record<string, string> = {
  created: 'bg-neutral-100 text-neutral-600',
  pending: 'bg-warning-50 text-warning-700',
  paid: 'bg-success-50 text-success-700',
  failed: 'bg-danger-50 text-danger-700',
  refunded: 'bg-primary-50 text-primary-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
};
const inr = (n: number): string => `₹${Number(n).toLocaleString('en-IN')}`;

export default function OrdersPage(): JSX.Element {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const endpoint = `/admin/orders?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) }).toString()}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1">Orders</h1>
        <p className="text-body-sm text-neutral-600">All checkout orders. Refund decisions live under Refunds.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`badge capitalize ${status === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
            {s || 'All'}
          </button>
        ))}
        <input className="input !h-9 ml-auto max-w-64" placeholder="Search order no / name / email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <DataTable
        endpoint={endpoint}
        csvPath="/admin/exports/orders"
        emptyText="No orders match."
        columns={[
          { key: 'orderNo', label: 'Order', render: (r) => <span className="font-medium">{r.orderNo}</span> },
          { key: 'userName', label: 'Customer', render: (r) => (
            <div><p className="font-medium">{r.userName}</p><p className="text-caption text-neutral-500">{r.userEmail}</p></div>
          ) },
          { key: 'internshipTitle', label: 'Internship', render: (r) => <span className="line-clamp-1">{r.internshipTitle ?? '—'}</span> },
          { key: 'totalAmount', label: 'Total', sortable: true, render: (r) => inr(r.totalAmount) },
          { key: 'status', label: 'Status', render: (r) => (
            <span className="flex items-center gap-1">
              <span className={`badge capitalize ${TONE[r.status] ?? 'bg-neutral-100'}`}>{r.status}</span>
              {r.hasRefund && <span className="badge bg-primary-50 text-primary-700">refund</span>}
            </span>
          ) },
          { key: 'invoiceNo', label: 'Invoice', render: (r) => r.invoiceNo ?? '—' },
          { key: 'createdAt', label: 'Date', sortable: true, render: (r) => new Date(r.createdAt).toLocaleDateString('en-IN') },
        ]}
      />
    </div>
  );
}
