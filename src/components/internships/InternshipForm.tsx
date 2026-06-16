'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

export interface InternshipFormValues {
  title: string;
  categoryId: number;
  instructorProfileId?: number;
  shortDescription?: string;
  description?: string;
  outcomes: string[];
  prerequisites: string[];
  languages: string[];
  providerType: string;
  pricingType: string;
  price: number;
  stipendAmount?: number;
  deliveryMode: string;
  paceType: string;
  level?: string;
  durationWeeks?: number;
  thumbnailUrl?: string;
  regenerateSlug?: boolean;
}

const PROVIDER = ['system', 'external'];
const PRICING = ['free', 'paid', 'stipend'];
const DELIVERY = ['recorded', 'live', 'hybrid', 'project_only'];
const PACE = ['batch', 'self_paced'];
const LEVEL = ['beginner', 'intermediate', 'advanced'];

const lines = (s: string): string[] => s.split('\n').map((x) => x.trim()).filter(Boolean);
const csv = (s: string): string[] => s.split(',').map((x) => x.trim()).filter(Boolean);

function Label({ children }: { children: React.ReactNode }): JSX.Element {
  return <label className="mb-1 block text-caption font-medium text-neutral-700">{children}</label>;
}

/** Create/edit form for an internship's core fields. */
export function InternshipForm({ initial, mode, submitLabel, onSubmit }: {
  initial?: Any;
  mode: 'create' | 'edit';
  submitLabel: string;
  onSubmit: (values: InternshipFormValues) => Promise<boolean>;
}): JSX.Element {
  const [cats, setCats] = useState<Any[]>([]);
  const [instructors, setInstructors] = useState<Any[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [title, setTitle] = useState<string>(initial?.title ?? '');
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ? String(initial.categoryId) : '');
  const [instructorProfileId, setInstructorProfileId] = useState<string>(initial?.instructorProfileId ? String(initial.instructorProfileId) : '');
  const [shortDescription, setShort] = useState<string>(initial?.shortDescription ?? '');
  const [description, setDescription] = useState<string>(initial?.description ?? '');
  const [outcomes, setOutcomes] = useState<string>((initial?.outcomes ?? []).join('\n'));
  const [prerequisites, setPrereq] = useState<string>((initial?.prerequisites ?? []).join('\n'));
  const [languages, setLanguages] = useState<string>((initial?.languages ?? ['english']).join(', '));
  const [providerType, setProvider] = useState<string>(initial?.providerType ?? 'system');
  const [pricingType, setPricing] = useState<string>(initial?.pricingType ?? 'free');
  const [price, setPrice] = useState<string>(initial?.price != null ? String(initial.price) : '0');
  const [stipendAmount, setStipend] = useState<string>(initial?.stipendAmount != null ? String(initial.stipendAmount) : '');
  const [deliveryMode, setDelivery] = useState<string>(initial?.deliveryMode ?? 'recorded');
  const [paceType, setPace] = useState<string>(initial?.paceType ?? 'self_paced');
  const [level, setLevel] = useState<string>(initial?.level ?? '');
  const [durationWeeks, setDuration] = useState<string>(initial?.durationWeeks != null ? String(initial.durationWeeks) : '');
  const [thumbnailUrl, setThumb] = useState<string>(initial?.thumbnailUrl ?? '');
  const [regenerateSlug, setRegen] = useState<boolean>(false);

  useEffect(() => {
    void api<Any[]>('/catalog/categories').then((r) => setCats(r.data)).catch(() => setCats([]));
    void api<Any[]>('/admin/instructors?limit=100').then((r) => setInstructors(r.data)).catch(() => setInstructors([]));
  }, []);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    if (!title.trim() || title.trim().length < 4) { setErr('Title must be at least 4 characters.'); return; }
    if (!categoryId) { setErr('Please choose a category.'); return; }
    const values: InternshipFormValues = {
      title: title.trim(),
      categoryId: Number(categoryId),
      instructorProfileId: instructorProfileId ? Number(instructorProfileId) : undefined,
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
      outcomes: lines(outcomes),
      prerequisites: lines(prerequisites),
      languages: csv(languages).length ? csv(languages) : ['english'],
      providerType,
      pricingType,
      price: pricingType === 'paid' ? Number(price) || 0 : 0,
      stipendAmount: pricingType === 'stipend' ? Number(stipendAmount) || 0 : undefined,
      deliveryMode,
      paceType,
      level: level || undefined,
      durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      ...(mode === 'edit' ? { regenerateSlug } : {}),
    };
    setBusy(true);
    const ok = await onSubmit(values);
    setBusy(false);
    if (!ok) setErr('Could not save — check the fields and try again.');
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {err && <div className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{err}</div>}

      <div className="card space-y-4 p-5">
        <div>
          <Label>Title *</Label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Full-Stack Web Development Internship" maxLength={160} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Category *</Label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select…</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Instructor</Label>
            <select className="input" value={instructorProfileId} onChange={(e) => setInstructorProfileId(e.target.value)}>
              <option value="">{mode === 'create' ? 'Default (your profile)' : 'Unchanged'}</option>
              {instructors.map((i) => <option key={i.id} value={i.id}>{i.name ?? `Profile #${i.id}`}{i.kycStatus ? ` · ${i.kycStatus}` : ''}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label>Short description</Label>
          <input className="input" value={shortDescription} onChange={(e) => setShort(e.target.value)} placeholder="One line shown on cards" maxLength={300} />
        </div>
        <div>
          <Label>Description</Label>
          <textarea className="input min-h-[120px] py-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full overview shown on the detail page" />
        </div>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <Label>Outcomes (one per line)</Label>
          <textarea className="input min-h-[100px] py-2" value={outcomes} onChange={(e) => setOutcomes(e.target.value)} placeholder={'Build a MERN app\nDeploy to production'} />
        </div>
        <div>
          <Label>Prerequisites (one per line)</Label>
          <textarea className="input min-h-[100px] py-2" value={prerequisites} onChange={(e) => setPrereq(e.target.value)} placeholder={'Basic JavaScript'} />
        </div>
      </div>

      <div className="card grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <Label>Pricing</Label>
          <select className="input" value={pricingType} onChange={(e) => setPricing(e.target.value)}>
            {PRICING.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {pricingType === 'paid' && (
          <div>
            <Label>Price (₹)</Label>
            <input className="input" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        )}
        {pricingType === 'stipend' && (
          <div>
            <Label>Stipend (₹)</Label>
            <input className="input" type="number" min={0} value={stipendAmount} onChange={(e) => setStipend(e.target.value)} />
          </div>
        )}
        <div>
          <Label>Provider</Label>
          <select className="input" value={providerType} onChange={(e) => setProvider(e.target.value)}>
            {PROVIDER.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <Label>Delivery mode</Label>
          <select className="input" value={deliveryMode} onChange={(e) => setDelivery(e.target.value)}>
            {DELIVERY.map((d) => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <Label>Pace</Label>
          <select className="input" value={paceType} onChange={(e) => setPace(e.target.value)}>
            {PACE.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <Label>Level</Label>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">—</option>
            {LEVEL.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <Label>Duration (weeks)</Label>
          <input className="input" type="number" min={1} value={durationWeeks} onChange={(e) => setDuration(e.target.value)} />
        </div>
        <div>
          <Label>Languages (comma-separated)</Label>
          <input className="input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="english, hindi" />
        </div>
        <div className="sm:col-span-3">
          <Label>Thumbnail URL</Label>
          <input className="input" value={thumbnailUrl} onChange={(e) => setThumb(e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="btn-primary px-6">{busy ? 'Saving…' : submitLabel}</button>
        {mode === 'edit' && (
          <label className="flex items-center gap-2 text-body-sm text-neutral-600">
            <input type="checkbox" checked={regenerateSlug} onChange={(e) => setRegen(e.target.checked)} />
            Update URL slug from title
          </label>
        )}
      </div>
    </form>
  );
}
