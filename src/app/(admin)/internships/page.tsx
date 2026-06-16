'use client';
import Link from 'next/link';
import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';

const STATUSES = ['', 'draft', 'pending_review', 'published', 'rejected', 'archived'] as const;
const TONE: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  pending_review: 'bg-warning-50 text-warning-700',
  published: 'bg-success-50 text-success-700',
  rejected: 'bg-danger-50 text-danger-700',
  archived: 'bg-neutral-100 text-neutral-500',
};
const inr = (n: number): string => `₹${Number(n).toLocaleString('en-IN')}`;

export default function InternshipsListPage(): JSX.Element {
  const [status, setStatus] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const endpoint = `/internships?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) }).toString()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1">Internships</h1>
          <p className="text-body-sm text-neutral-600">Create, edit, and publish internship programs. Every change is audit-logged.</p>
        </div>
        <Link href="/internships/new" className="btn-primary px-4">+ New internship</Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`badge capitalize ${status === s ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
        <input className="input !h-9 ml-auto max-w-56" placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <DataTable
        endpoint={endpoint}
        emptyText="No internships yet — create your first one."
        columns={[
          { key: 'title', label: 'Title', sortable: true, render: (r) => (
            <Link href={`/internships/${r.id}`} className="font-medium text-primary-700 hover:underline">{r.title}</Link>
          ) },
          { key: 'status', label: 'Status', render: (r) => <span className={`badge capitalize ${TONE[r.status] ?? 'bg-neutral-100'}`}>{String(r.status).replace('_', ' ')}</span> },
          { key: 'categoryName', label: 'Category' },
          { key: 'instructorName', label: 'Instructor' },
          { key: 'pricingType', label: 'Pricing', render: (r) => r.pricingType === 'paid' ? inr(r.price) : r.pricingType },
          { key: 'lessonCount', label: 'Lessons', render: (r) => `${r.sectionCount}§ · ${r.lessonCount}▦` },
          { key: 'enrollmentCount', label: 'Enrolled' },
          { key: 'updatedAt', label: 'Updated', sortable: true, render: (r) => new Date(r.updatedAt).toLocaleDateString('en-IN') },
        ]}
        actions={(row) => (
          <Link href={`/internships/${row.id}`} className="btn-outline !h-8 px-3 text-body-sm">Manage</Link>
        )}
      />
    </div>
  );
}
