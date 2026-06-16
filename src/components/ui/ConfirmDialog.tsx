'use client';
import { useState } from 'react';

interface Props {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  body?: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  /** Optional reason textarea; value passed to onConfirm. */
  withReason?: { placeholder: string; templates?: string[] };
  auditNotice?: string;
  onConfirm: (reason?: string) => Promise<boolean | void>;
}

/** Confirm dialog with optional reason templates + audit notice. */
export function ConfirmDialog({ trigger, title, body, confirmLabel, danger, withReason, auditNotice, onConfirm }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <>
      {trigger(() => { setReason(''); setOpen(true); })}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4" role="dialog" aria-modal>
          <div className="card w-full max-w-md p-5 shadow-e3">
            <h3 className="text-h3">{title}</h3>
            {body && <div className="mt-2 text-body-sm text-neutral-700">{body}</div>}
            {withReason && (
              <div className="mt-3 space-y-2">
                {withReason.templates && (
                  <div className="flex flex-wrap gap-1.5">
                    {withReason.templates.map((t) => (
                      <button key={t} className="badge border border-neutral-300 bg-white text-neutral-700 hover:border-primary-400" onClick={() => setReason(t)}>{t}</button>
                    ))}
                  </div>
                )}
                <textarea className="input min-h-20 py-2" placeholder={withReason.placeholder} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            )}
            {auditNotice && <p className="mt-3 rounded-md bg-warning-50 px-3 py-2 text-caption text-warning-900">⚠ {auditNotice}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-outline !h-10" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button
                className={`btn-primary !h-10 ${danger ? '!bg-danger-600 hover:!bg-danger-700' : ''}`}
                disabled={busy || (withReason && !reason.trim())}
                onClick={async () => {
                  setBusy(true);
                  const ok = await onConfirm(withReason ? reason.trim() : undefined);
                  setBusy(false);
                  if (ok !== false) setOpen(false);
                }}>
                {busy ? 'Working…' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
