'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function AdminLoginForm(): JSX.Element {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/dashboard';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
      <form
        className="card w-full max-w-sm space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true); setError(null);
          const res = await fetch('/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier, password }) });
          const body = (await res.json()) as { success: boolean; error: { code: string; message: string } | null };
          setBusy(false);
          if (!body.success) { setError(body.error?.message ?? 'Login failed'); return; }
          router.push(next); router.refresh();
        }}>
        <div>
          <h1 className="font-heading text-h2 text-primary-600">GUM Admin</h1>
          <p className="text-body-sm text-neutral-600">Staff accounts only. All actions are audited.</p>
        </div>
        <input className="input" placeholder="Email or phone" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
export default function AdminLogin(): JSX.Element {
  return <Suspense><AdminLoginForm /></Suspense>;
}
