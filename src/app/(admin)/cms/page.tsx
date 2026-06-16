'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const PLACEMENTS = ['home_hero', 'home_strip', 'category_page'];

export default function CmsPage(): JSX.Element {
  const toast = useToast();
  const [banners, setBanners] = useState<Any[] | null>(null);
  const [pages, setPages] = useState<Any[] | null>(null);
  const [editing, setEditing] = useState<{ kind: 'banner' | 'page'; data: Any | null } | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const [b, p] = await Promise.all([
      api<Any[]>('/admin/cms/banners').catch(() => ({ data: [] as Any[] })),
      api<Any[]>('/admin/cms/pages').catch(() => ({ data: [] as Any[] })),
    ]);
    setBanners(b.data); setPages(p.data);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const toggleBanner = async (b: Any): Promise<void> => {
    try {
      await api(`/admin/cms/banners/${b.id}`, { method: 'PATCH', body: JSON.stringify(bannerPayload(b, { isActive: !b.isActive })) });
      toast('success', b.isActive ? 'Banner hidden' : 'Banner shown'); await load();
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not update.'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1">CMS</h1>
        <p className="text-body-sm text-neutral-600">Home banners and static content pages. Changes go live immediately and are audit-logged.</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h3">Banners</h2>
          <button onClick={() => setEditing({ kind: 'banner', data: null })} className="btn-primary px-4">+ New banner</button>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-body-sm">
            <thead><tr className="bg-neutral-50 text-left text-caption uppercase text-neutral-600">
              <th className="px-4 py-2.5">Title</th><th className="px-4 py-2.5">Placement</th><th className="px-4 py-2.5">Order</th><th className="px-4 py-2.5">State</th><th className="px-4 py-2.5 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {!banners ? <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">Loading…</td></tr>
              : banners.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No banners yet.</td></tr>
              : banners.map((b) => (
                <tr key={b.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-medium">{b.title}</td>
                  <td className="px-4 py-2.5">{String(b.placement).replace('_', ' ')}</td>
                  <td className="px-4 py-2.5">{b.displayOrder}</td>
                  <td className="px-4 py-2.5"><span className={`badge ${b.isActive ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>{b.isActive ? 'active' : 'hidden'}</span></td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="flex justify-end gap-2">
                      <button onClick={() => toggleBanner(b)} className="btn-outline !h-8 px-3 text-body-sm">{b.isActive ? 'Hide' : 'Show'}</button>
                      <button onClick={() => setEditing({ kind: 'banner', data: b })} className="btn-outline !h-8 px-3 text-body-sm">Edit</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h3">Static pages</h2>
          <button onClick={() => setEditing({ kind: 'page', data: null })} className="btn-primary px-4">+ New page</button>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-body-sm">
            <thead><tr className="bg-neutral-50 text-left text-caption uppercase text-neutral-600">
              <th className="px-4 py-2.5">Slug</th><th className="px-4 py-2.5">Title</th><th className="px-4 py-2.5">State</th><th className="px-4 py-2.5 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {!pages ? <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Loading…</td></tr>
              : pages.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">No pages yet.</td></tr>
              : pages.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2.5 font-mono text-caption">/{p.slug}</td>
                  <td className="px-4 py-2.5 font-medium">{p.title}</td>
                  <td className="px-4 py-2.5"><span className={`badge ${p.isPublished ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>{p.isPublished ? 'published' : 'draft'}</span></td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => setEditing({ kind: 'page', data: p })} className="btn-outline !h-8 px-3 text-body-sm">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <CmsEditor
          kind={editing.kind}
          data={editing.data}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); }}
        />
      )}
    </div>
  );
}

function bannerPayload(b: Any, overrides: Any): Any {
  return {
    title: b.title, imageUrl: b.imageUrl, ...(b.linkUrl ? { linkUrl: b.linkUrl } : {}),
    placement: b.placement, displayOrder: b.displayOrder ?? 0,
    ...(b.startsAt ? { startsAt: b.startsAt } : {}), ...(b.endsAt ? { endsAt: b.endsAt } : {}),
    isActive: b.isActive, ...overrides,
  };
}

function CmsEditor({ kind, data, onClose, onSaved }: { kind: 'banner' | 'page'; data: Any | null; onClose: () => void; onSaved: () => void }): JSX.Element {
  const toast = useToast();
  const [f, setF] = useState<Any>(
    kind === 'banner'
      ? { title: data?.title ?? '', imageUrl: data?.imageUrl ?? '', linkUrl: data?.linkUrl ?? '', placement: data?.placement ?? 'home_hero', displayOrder: String(data?.displayOrder ?? 0), isActive: data?.isActive ?? true, startsAt: data?.startsAt, endsAt: data?.endsAt }
      : { slug: data?.slug ?? '', title: data?.title ?? '', contentMd: data?.contentMd ?? '', metaTitle: data?.metaTitle ?? '', metaDescription: data?.metaDescription ?? '', isPublished: data?.isPublished ?? false },
  );
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown): void => setF((p: Any) => ({ ...p, [k]: v }));

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      const base = kind === 'banner' ? '/admin/cms/banners' : '/admin/cms/pages';
      const body = kind === 'banner'
        ? bannerPayload({ ...f, displayOrder: Number(f.displayOrder) || 0 }, {})
        : { slug: f.slug, title: f.title, contentMd: f.contentMd, ...(f.metaTitle ? { metaTitle: f.metaTitle } : {}), ...(f.metaDescription ? { metaDescription: f.metaDescription } : {}), isPublished: f.isPublished };
      if (data?.id) await api(`${base}/${data.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await api(base, { method: 'POST', body: JSON.stringify(body) });
      toast('success', 'Saved'); onSaved();
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not save.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4" role="dialog" aria-modal>
      <div className="card max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto p-5 text-left">
        <h3 className="text-h3">{data?.id ? 'Edit' : 'New'} {kind}</h3>
        {kind === 'banner' ? (
          <>
            <Field label="Title"><input className="input" value={f.title} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="Image URL"><input className="input" value={f.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" /></Field>
            <Field label="Link URL (optional)"><input className="input" value={f.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="https://…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Placement"><select className="input" value={f.placement} onChange={(e) => set('placement', e.target.value)}>{PLACEMENTS.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}</select></Field>
              <Field label="Display order"><input className="input" type="number" value={f.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} /></Field>
            </div>
            <label className="flex items-center gap-2 text-body-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active</label>
          </>
        ) : (
          <>
            <Field label="Slug"><input className="input font-mono" value={f.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} placeholder="about-us" /></Field>
            <Field label="Title"><input className="input" value={f.title} onChange={(e) => set('title', e.target.value)} /></Field>
            <Field label="Content (Markdown)"><textarea className="input min-h-[160px] py-2 font-mono text-caption" value={f.contentMd} onChange={(e) => set('contentMd', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Meta title"><input className="input" value={f.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} /></Field>
              <Field label="Meta description"><input className="input" value={f.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} /></Field>
            </div>
            <label className="flex items-center gap-2 text-body-sm"><input type="checkbox" checked={f.isPublished} onChange={(e) => set('isPublished', e.target.checked)} /> Published</label>
          </>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-outline px-4" onClick={onClose}>Cancel</button>
          <button className="btn-primary px-4" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return <div><label className="mb-1 block text-caption font-medium text-neutral-700">{label}</label>{children}</div>;
}
