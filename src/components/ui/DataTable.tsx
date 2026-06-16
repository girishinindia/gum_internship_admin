'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export interface Column {
  key: string;
  label: string;
  render?: (row: Row) => React.ReactNode;
  sortable?: boolean;
}

interface Props {
  /** Proxy path, e.g. /admin/users — server pagination via ?page=&limit=. */
  endpoint: string;
  columns: Column[];
  /** Extra query filters rendered as inputs: key → placeholder. */
  filters?: Record<string, string>;
  /** Streaming CSV export endpoint (downloads via proxy). */
  csvPath?: string;
  /** Row actions slot. */
  actions?: (row: Row, reload: () => void) => React.ReactNode;
  emptyText?: string;
}

/** Reusable admin DataTable: server pagination, client column sort, filters, CSV export. */
export function DataTable({ endpoint, columns, filters = {}, csvPath, actions, emptyText = 'Nothing here' }: Props): JSX.Element {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    for (const [k, v] of Object.entries(filterValues)) if (v) qs.set(k, v);
    setLoading(true);
    api<Row[]>(`${endpoint}${endpoint.includes('?') ? '&' : '?'}${qs.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setTotal(res.meta?.pagination?.total ?? res.data.length);
      })
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [endpoint, page, limit, filterValues, nonce]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => (String(a[sort.key] ?? '') > String(b[sort.key] ?? '') ? sort.dir : -sort.dir));
  }, [rows, sort]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const reload = (): void => setNonce((n) => n + 1);

  return (
    <div className="card overflow-hidden">
      {(Object.keys(filters).length > 0 || csvPath) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-50 p-3">
          {Object.entries(filters).map(([k, placeholder]) => (
            <input key={k} className="input !h-9 max-w-48" placeholder={placeholder}
              onChange={(e) => { setPage(1); setFilterValues((f) => ({ ...f, [k]: e.target.value })); }} />
          ))}
          {csvPath && (
            <a href={`/api/proxy${csvPath}`} className="btn-outline !h-9 ml-auto px-3 text-body-sm" download>
              ⬇ Export CSV
            </a>
          )}
        </div>
      )}
      <table className="w-full text-body-sm">
        <thead>
          <tr className="bg-neutral-50 text-left text-caption uppercase text-neutral-600">
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2.5">
                {c.sortable ? (
                  <button className="hover:text-neutral-900" onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))}>
                    {c.label} {sort?.key === c.key ? (sort.dir === 1 ? '↑' : '↓') : ''}
                  </button>
                ) : c.label}
              </th>
            ))}
            {actions && <th className="px-4 py-2.5 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-neutral-500">Loading…</td></tr>
          ) : sorted.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-neutral-500">{emptyText}</td></tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={String(row.id ?? i)} className="border-t border-neutral-100 hover:bg-neutral-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5">{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>
                ))}
                {actions && <td className="px-4 py-2.5 text-right">{actions(row, reload)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2.5 text-body-sm text-neutral-600">
        <span>{total} rows</span>
        <span className="flex items-center gap-2">
          <button className="btn-outline !h-8 px-2.5 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</button>
          Page {page} / {totalPages}
          <button className="btn-outline !h-8 px-2.5 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
        </span>
      </div>
    </div>
  );
}
