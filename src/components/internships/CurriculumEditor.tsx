'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const LESSON_TYPES = ['video', 'live', 'document', 'quiz'] as const;

/** Sections + lessons editor for one internship. `reload` refetches the parent detail. */
export function CurriculumEditor({ internshipId, sections, reload }: {
  internshipId: number; sections: Any[]; reload: () => void;
}): JSX.Element {
  const toast = useToast();
  const [newSection, setNewSection] = useState('');
  const [busy, setBusy] = useState(false);

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

  const addSection = async (): Promise<void> => {
    if (newSection.trim().length < 2) return;
    await call('POST', `/internships/${internshipId}/sections`, { title: newSection.trim() }, 'Section added');
    setNewSection('');
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 && <p className="text-body-sm text-neutral-500">No sections yet. Add one below to start building the curriculum.</p>}

      {sections.map((sec) => (
        <SectionCard key={sec.id} section={sec} busy={busy} call={call} />
      ))}

      <div className="card flex items-end gap-2 p-4">
        <div className="flex-1">
          <label className="mb-1 block text-caption font-medium text-neutral-700">New section</label>
          <input className="input" value={newSection} onChange={(e) => setNewSection(e.target.value)} placeholder="e.g. Backend Foundations" maxLength={160}
            onKeyDown={(e) => { if (e.key === 'Enter') void addSection(); }} />
        </div>
        <button onClick={addSection} disabled={busy || newSection.trim().length < 2} className="btn-primary px-4">Add section</button>
      </div>
    </div>
  );
}

function SectionCard({ section, busy, call }: {
  section: Any; busy: boolean; call: (m: string, p: string, b?: unknown, ok?: string) => Promise<void>;
}): JSX.Element {
  const [title, setTitle] = useState<string>(section.title);
  const [adding, setAdding] = useState(false);
  const lessons = (section.lessons ?? []) as Any[];

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        <input className="input flex-1 font-medium" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
        {title !== section.title && (
          <button onClick={() => call('PATCH', `/sections/${section.id}`, { title: title.trim() }, 'Section renamed')} disabled={busy} className="btn-outline !h-9 px-3 text-body-sm">Save</button>
        )}
        <button onClick={() => { if (confirm('Delete this section and its lessons?')) void call('DELETE', `/sections/${section.id}`, undefined, 'Section deleted'); }}
          disabled={busy} className="btn-outline !h-9 px-3 text-body-sm !text-danger-700">Delete</button>
      </div>

      <ul className="mt-3 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200">
        {lessons.length === 0 && <li className="px-3 py-2.5 text-body-sm text-neutral-400">No lessons yet.</li>}
        {lessons.map((l) => (
          <li key={l.id} className="flex items-center gap-2 px-3 py-2.5 text-body-sm">
            <span className="badge bg-neutral-100 capitalize text-neutral-600">{l.type}</span>
            <span className="flex-1">{l.title}{l.durationMinutes ? <span className="text-neutral-400"> · {l.durationMinutes}m</span> : null}</span>
            <button onClick={() => call('PATCH', `/lessons/${l.id}`, { isPreview: !l.isPreview }, l.isPreview ? 'Preview off' : 'Preview on')} disabled={busy}
              className={`badge ${l.isPreview ? 'bg-primary-50 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>{l.isPreview ? 'Preview' : 'Locked'}</button>
            <button onClick={() => { if (confirm('Delete this lesson?')) void call('DELETE', `/lessons/${l.id}`, undefined, 'Lesson deleted'); }}
              disabled={busy} className="text-danger-600 hover:underline">Delete</button>
          </li>
        ))}
      </ul>

      {adding
        ? <AddLesson sectionId={section.id} busy={busy} call={call} done={() => setAdding(false)} />
        : <button onClick={() => setAdding(true)} className="mt-2 text-body-sm font-medium text-primary-700">+ Add lesson</button>}
    </div>
  );
}

function AddLesson({ sectionId, busy, call, done }: {
  sectionId: number; busy: boolean; call: (m: string, p: string, b?: unknown, ok?: string) => Promise<void>; done: () => void;
}): JSX.Element {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('video');
  const [duration, setDuration] = useState('');
  const [ref, setRef] = useState(''); // bunnyVideoId / documentUrl / quizId depending on type
  const [isPreview, setPreview] = useState(false);
  const [isMandatory, setMandatory] = useState(true);

  const refLabel = type === 'video' ? 'Bunny video ID' : type === 'document' ? 'Document URL' : type === 'quiz' ? 'Quiz ID' : '';

  const add = async (): Promise<void> => {
    if (title.trim().length < 2) return;
    const body: Any = {
      title: title.trim(), type,
      durationMinutes: duration ? Number(duration) : undefined,
      isPreview, isMandatory,
    };
    if (type === 'video' && ref) body.bunnyVideoId = ref.trim();
    if (type === 'document' && ref) body.documentUrl = ref.trim();
    if (type === 'quiz') body.quizId = ref ? Number(ref) : undefined;
    await call('POST', `/sections/${sectionId}/lessons`, body, 'Lesson added');
    done();
  };

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-dashed border-neutral-300 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" placeholder="Lesson title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        <select className="input" value={type} onChange={(e) => { setType(e.target.value); setRef(''); }}>
          {LESSON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="input" type="number" min={0} placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} />
        {refLabel && <input className="input" placeholder={refLabel} value={ref} onChange={(e) => setRef(e.target.value)} />}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-body-sm text-neutral-600">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={isPreview} onChange={(e) => setPreview(e.target.checked)} /> Free preview</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={isMandatory} onChange={(e) => setMandatory(e.target.checked)} /> Mandatory</label>
        <span className="ml-auto flex gap-2">
          <button onClick={done} className="btn-outline !h-8 px-3 text-body-sm">Cancel</button>
          <button onClick={add} disabled={busy || title.trim().length < 2} className="btn-primary !h-8 px-3 text-body-sm">Add</button>
        </span>
      </div>
    </div>
  );
}
