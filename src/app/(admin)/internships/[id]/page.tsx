'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { InternshipForm } from '@/components/internships/InternshipForm';
import type { InternshipFormValues } from '@/components/internships/InternshipForm';
import { CurriculumEditor } from '@/components/internships/CurriculumEditor';
import { BatchEditor } from '@/components/internships/BatchEditor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const TABS = ['Details', 'Curriculum', 'Batches', 'Publish'] as const;
const TONE: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  pending_review: 'bg-warning-50 text-warning-700',
  published: 'bg-success-50 text-success-700',
  rejected: 'bg-danger-50 text-danger-700',
  archived: 'bg-neutral-100 text-neutral-500',
};

export default function EditInternshipPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const iid = Number(id);
  const toast = useToast();
  const [data, setData] = useState<Any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Details');

  const load = useCallback(async (): Promise<void> => {
    try { const { data: d } = await api<Any>(`/internships/${iid}`); setData(d); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'Could not load this internship.'); }
  }, [iid]);
  useEffect(() => { void load(); }, [load]);

  const save = async (values: InternshipFormValues): Promise<boolean> => {
    try {
      await api(`/internships/${iid}`, { method: 'PATCH', body: JSON.stringify(values) });
      toast('success', 'Changes saved.');
      await load();
      return true;
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not save.');
      return false;
    }
  };

  const setStatus = async (action: string, reason?: string): Promise<void> => {
    try {
      const { data: r } = await api<Any>(`/internships/${iid}/status`, { method: 'POST', body: JSON.stringify({ action, reason }) });
      toast('success', `Status: ${String(r.status).replace('_', ' ')}.`);
      await load();
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not change status.');
    }
  };

  if (err) return <p className="text-danger-700">{err}</p>;
  if (!data) return <p className="text-neutral-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <Link href="/internships" className="text-body-sm text-primary-700 hover:underline">‹ Internships</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1">{data.title}</h1>
          <p className="text-body-sm text-neutral-500">/{data.slug} · {data.categoryName} · {data.instructorName}</p>
        </div>
        <span className={`badge capitalize ${TONE[data.status] ?? 'bg-neutral-100'}`}>{String(data.status).replace('_', ' ')}</span>
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-body-sm font-medium ${tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Details' && <InternshipForm key={data.updatedAt} mode="edit" initial={data} submitLabel="Save changes" onSubmit={save} />}
      {tab === 'Curriculum' && <CurriculumEditor internshipId={iid} sections={data.sections ?? []} reload={load} />}
      {tab === 'Batches' && (
        data.paceType === 'batch'
          ? <BatchEditor internshipId={iid} batches={data.batches ?? []} reload={load} />
          : <div className="card p-5 text-body-sm text-neutral-600">
              This internship is <strong>self-paced</strong>, so it has no cohorts or seat limits — learners enrol any time and there's no waitlist.
              To run fixed cohorts with seats, change the pace to <strong>batch</strong> on the <button className="text-primary-700 underline" onClick={() => setTab('Details')}>Details</button> tab.
            </div>
      )}
      {tab === 'Publish' && <PublishPanel data={data} onAction={setStatus} />}
    </div>
  );
}

function PublishPanel({ data, onAction }: { data: Any; onAction: (action: string, reason?: string) => Promise<void> }): JSX.Element {
  const status = data.status as string;
  const lessonCount = ((data.sections ?? []) as Any[]).reduce((n, s) => n + ((s.lessons ?? []) as Any[]).length, 0);
  return (
    <div className="card max-w-2xl space-y-4 p-5">
      <div>
        <p className="text-body-sm text-neutral-600">Current status</p>
        <p className="text-h3 capitalize">{status.replace('_', ' ')}</p>
        {data.rejectionReason && <p className="mt-1 text-body-sm text-danger-700">Reason: {data.rejectionReason}</p>}
        {data.publishedAt && <p className="text-caption text-neutral-500">Published {new Date(data.publishedAt).toLocaleString('en-IN')}</p>}
      </div>

      <div className="rounded-lg bg-neutral-50 p-3 text-body-sm text-neutral-600">
        {lessonCount} lesson{lessonCount === 1 ? '' : 's'} across {((data.sections ?? []) as Any[]).length} section(s).
        {lessonCount === 0 && <span className="text-danger-700"> Add at least one lesson before publishing.</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {(status === 'draft' || status === 'rejected') && (
          <button onClick={() => onAction('submit')} className="btn-outline px-4">Submit for review</button>
        )}
        {status !== 'published' && (
          <button onClick={() => onAction('publish')} disabled={lessonCount === 0} className="btn-primary px-4 disabled:opacity-50">Publish now</button>
        )}
        {status === 'published' && (
          <button onClick={() => onAction('unpublish')} className="btn-outline px-4">Unpublish (back to draft)</button>
        )}
        {status !== 'archived' && (
          <button onClick={() => { if (confirm('Archive this internship?')) void onAction('archive'); }} className="btn-outline px-4 !text-danger-700">Archive</button>
        )}
      </div>
      <p className="text-caption text-neutral-500">Publishing makes the internship visible in the public catalog. Every status change is written to the audit log.</p>
    </div>
  );
}
