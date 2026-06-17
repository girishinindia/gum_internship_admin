'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

type SessionResponse = {
  success: boolean;
  data?: { twoFactorRequired?: boolean; challengeToken?: string } | null;
  error?: { code: string; message: string } | null;
};

function AdminLoginForm(): JSX.Element {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/dashboard';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (payload: Record<string, unknown>): Promise<SessionResponse> => {
    const res = await fetch('/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    return (await res.json()) as SessionResponse;
  };

  const submitCreds = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); setBusy(true); setError(null);
    const body = await post({ identifier, password });
    setBusy(false);
    if (!body.success) { setError(body.error?.message ?? 'Login failed'); return; }
    if (body.data?.twoFactorRequired && body.data.challengeToken) { setChallengeToken(body.data.challengeToken); return; }
    router.push(next); router.refresh();
  };

  const submitCode = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); setBusy(true); setError(null);
    const body = await post({ challengeToken, token: code });
    setBusy(false);
    if (!body.success) { setError(body.error?.message ?? 'Verification failed'); return; }
    router.push(next); router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
      {challengeToken === null ? (
        <form className="card w-full max-w-sm space-y-4 p-6" onSubmit={submitCreds}>
          <div>
            <h1 className="font-heading text-h2 text-primary-600">GUM Admin</h1>
            <p className="text-body-sm text-neutral-600">Staff accounts only. All actions are audited.</p>
          </div>
          <input className="input" placeholder="Email or phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="text-center text-body-sm text-neutral-500">
            <a href="/forgot-password" className="font-medium text-primary-600 hover:underline">Forgot password?</a>
          </p>
        </form>
      ) : (
        <form className="card w-full max-w-sm space-y-4 p-6" onSubmit={submitCode}>
          <div>
            <h1 className="font-heading text-h2 text-primary-600">Two-factor verification</h1>
            <p className="text-body-sm text-neutral-600">Enter the 6-digit code from your authenticator app, or an 8-digit backup code.</p>
          </div>
          <input className="input text-center tracking-widest" placeholder="123456" inputMode="numeric" autoComplete="one-time-code" autoFocus
            value={code} onChange={(e) => setCode(e.target.value)} required />
          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify'}</button>
          <button type="button" className="text-body-sm text-neutral-500 hover:text-neutral-800" onClick={() => { setChallengeToken(null); setCode(''); setError(null); }}>‹ Back to sign in</button>
        </form>
      )}
    </div>
  );
}

export default function AdminLogin(): JSX.Element {
  return <Suspense><AdminLoginForm /></Suspense>;
}
