import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AT_COOKIE, RT_COOKIE, apiSend } from '@/lib/serverApi';
import type { SessionUser } from '@/lib/types';

interface AuthTokens { accessToken: string; refreshToken: string; expiresIn: number; user: SessionUser }
interface Challenge { twoFactorRequired: true; challengeToken: string }
type LoginResult = AuthTokens | Challenge;
const ADMIN_ROLES = ['moderator', 'finance_admin', 'support', 'super_admin'];
const base = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };

export async function POST(req: Request): Promise<NextResponse> {
  const input = (await req.json()) as { identifier?: string; password?: string; challengeToken?: string; token?: string };

  // Step 1 = password login; step 2 = submit the 2FA code with the challenge token.
  const { status, body } = input.challengeToken
    ? await apiSend<LoginResult>('POST', '/auth/2fa/verify', { challengeToken: input.challengeToken, token: input.token })
    : await apiSend<LoginResult>('POST', '/auth/login', { identifier: input.identifier, password: input.password });
  if (!body.success) return NextResponse.json(body, { status });

  // Login answered with a 2FA challenge — relay it to the client, set no cookies.
  if ('twoFactorRequired' in body.data) {
    return NextResponse.json({ success: true, data: { twoFactorRequired: true, challengeToken: body.data.challengeToken }, error: null });
  }

  const tokens = body.data;
  if (!tokens.user.roles.some((r) => ADMIN_ROLES.includes(r))) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'This portal is for staff accounts only' } },
      { status: 403 },
    );
  }
  const res = NextResponse.json({ success: true, data: { user: tokens.user }, error: null });
  res.cookies.set(AT_COOKIE, tokens.accessToken, { ...base, maxAge: tokens.expiresIn });
  res.cookies.set(RT_COOKIE, tokens.refreshToken, { ...base, maxAge: 30 * 24 * 3600 });
  res.cookies.set('gum_admin', JSON.stringify({ name: tokens.user.fullName, roles: tokens.user.roles }), { ...base, httpOnly: false, maxAge: 30 * 24 * 3600 });
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const rt = cookies().get(RT_COOKIE)?.value;
  if (rt) await apiSend('POST', '/auth/logout', { refreshToken: rt }).catch(() => undefined);
  const res = NextResponse.json({ success: true, data: { message: 'Logged out' }, error: null });
  res.cookies.delete(AT_COOKIE); res.cookies.delete(RT_COOKIE); res.cookies.delete('gum_admin');
  return res;
}
