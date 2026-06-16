'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;
const group = (s: string): string => (s.match(/.{1,4}/g) ?? [s]).join(' ');

export default function SecurityPage(): JSX.Element {
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (): Promise<void> => {
    try { const { data } = await api<Any>('/users/me'); setEnabled(Boolean(data.twoFactorEnabled)); }
    catch { setEnabled(false); }
  };
  useEffect(() => { void load(); }, []);

  const run = async (fn: () => Promise<void>): Promise<void> => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  const startSetup = (): Promise<void> => run(async () => {
    try { const { data } = await api<{ secret: string; otpauthUrl: string }>('/auth/2fa/setup', { method: 'POST' }); setSetup(data); setBackupCodes(null); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Could not start setup.'); }
  });
  const enable = (): Promise<void> => run(async () => {
    try {
      const { data } = await api<{ backupCodes: string[] }>('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ token: code }) });
      setBackupCodes(data.backupCodes); setSetup(null); setCode(''); setEnabled(true); toast('success', 'Two-factor is now on.');
    } catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Incorrect code — try again.'); }
  });
  const disable = (): Promise<void> => run(async () => {
    try { await api('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ token: code }) }); setEnabled(false); setCode(''); setBackupCodes(null); toast('success', 'Two-factor disabled.'); }
    catch (e) { toast('danger', e instanceof ApiError ? e.message : 'Incorrect code.'); }
  });

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h1 className="text-h1">Security</h1>
        <p className="text-body-sm text-neutral-600">Protect your staff account with two-factor authentication (TOTP).</p>
      </div>

      {backupCodes && (
        <div className="card space-y-2 border-warning-300 bg-warning-50/50 p-5">
          <h2 className="text-h3">Save your backup codes</h2>
          <p className="text-body-sm text-neutral-700">Each code works once if you lose your authenticator. Store them somewhere safe — they won't be shown again.</p>
          <div className="grid grid-cols-2 gap-2 font-mono text-body-sm">
            {backupCodes.map((c) => <span key={c} className="rounded bg-white px-3 py-1.5 text-center">{c}</span>)}
          </div>
          <button className="btn-outline mt-1 px-4" onClick={() => { void navigator.clipboard?.writeText(backupCodes.join('\n')); toast('success', 'Copied'); }}>Copy all</button>
        </div>
      )}

      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-h3">Two-factor authentication</h2>
          <span className={`badge ${enabled ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-600'}`}>{enabled === null ? '…' : enabled ? 'On' : 'Off'}</span>
        </div>

        {enabled === null ? <p className="text-neutral-500">Loading…</p>
          : enabled ? (
            <div className="space-y-3">
              <p className="text-body-sm text-neutral-700">2FA is enabled. To turn it off, enter a current code (or a backup code).</p>
              <input className="input max-w-48" placeholder="123456" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} />
              <div><button className="btn-outline px-4 !text-danger-700" disabled={busy || code.length < 6} onClick={() => void disable()}>Disable 2FA</button></div>
            </div>
          ) : setup ? (
            <div className="space-y-3">
              <ol className="list-decimal space-y-2 pl-5 text-body-sm text-neutral-700">
                <li>Open your authenticator app (Google Authenticator, Authy, 1Password…).</li>
                <li>Add an account → enter this secret (or scan the otpauth link):
                  <div className="mt-1 rounded-md bg-neutral-100 px-3 py-2 font-mono text-body-sm">{group(setup.secret)}</div>
                  <button className="mt-1 text-caption text-primary-600" onClick={() => { void navigator.clipboard?.writeText(setup.secret); toast('success', 'Secret copied'); }}>Copy secret</button>
                  <button className="ml-3 mt-1 text-caption text-primary-600" onClick={() => { void navigator.clipboard?.writeText(setup.otpauthUrl); toast('success', 'otpauth link copied'); }}>Copy otpauth link</button>
                </li>
                <li>Enter the 6-digit code it shows:</li>
              </ol>
              <input className="input max-w-48" placeholder="123456" inputMode="numeric" autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
              <div className="flex gap-2">
                <button className="btn-primary px-4" disabled={busy || code.length < 6} onClick={() => void enable()}>Turn on 2FA</button>
                <button className="btn-outline px-4" onClick={() => { setSetup(null); setCode(''); }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-body-sm text-neutral-700">Add a second step at sign-in using a code from your phone. Recommended for all staff.</p>
              <button className="btn-primary px-4" disabled={busy} onClick={() => void startSetup()}>Set up two-factor</button>
            </div>
          )}
      </div>
    </div>
  );
}
