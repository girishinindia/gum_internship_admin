'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';

export default function AdminForgotPassword(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [show, setShow] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      await api('/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) });
    } catch {
      // Don't reveal whether the email exists.
    } finally {
      setBusy(false);
      setNote('If that staff email exists, a 6-digit reset code has been sent.');
      setStep('reset');
    }
  };

  const reset = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); setBusy(true); setError(null); setNote(null);
    try {
      await api('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), newPassword }),
      });
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password. Check the code and try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
      {step === 'request' ? (
        <form className="card w-full max-w-sm space-y-4 p-6" onSubmit={requestCode}>
          <div>
            <h1 className="font-heading text-h2 text-primary-600">Reset password</h1>
            <p className="text-body-sm text-neutral-600">Enter your staff email to receive a 6-digit reset code.</p>
          </div>
          <input className="input" type="email" placeholder="Staff email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset code'}</button>
          <a href="/login" className="block text-center text-body-sm text-neutral-500 hover:text-neutral-800">‹ Back to sign in</a>
        </form>
      ) : (
        <form className="card w-full max-w-sm space-y-4 p-6" onSubmit={reset}>
          <div>
            <h1 className="font-heading text-h2 text-primary-600">Enter reset code</h1>
            {note && <p className="text-body-sm text-success-700">{note}</p>}
          </div>
          <input className="input text-center tracking-widest" placeholder="123456" inputMode="numeric" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
          <div className="relative">
            <input className="input pr-16" type={show ? 'text' : 'password'} placeholder="New password" autoComplete="new-password" minLength={8}
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 px-3 text-body-sm font-medium text-primary-600">
              {show ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Updating…' : 'Set new password'}</button>
          <button type="button" className="block w-full text-center text-body-sm text-neutral-500 hover:text-neutral-800" onClick={() => { setStep('request'); setError(null); }}>Use a different email</button>
        </form>
      )}
    </div>
  );
}
