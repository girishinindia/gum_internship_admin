import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AT_COOKIE, RT_COOKIE, apiSend } from '@/lib/serverApi';
import type { SessionUser } from '@/lib/types';

interface AuthTokens { accessToken: string; refreshToken: string; expiresIn: number; user: SessionUser }
const ADMIN_ROLES = ['moderator', 'finance_admin', 'support', 'super_admin'];
const base = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };

export async function POST(req: Request): Promise<NextResponse> {
  const creds = (await req.json()) as { identifier: string; password: string };
  const { status, body } = await apiSend<AuthTokens>('POST', '/auth/login', creds);
  if (!body.success) return NextResponse.json(body, { status });
  if (!body.data.user.roles.some((r) => ADMIN_ROLES.includes(r))) {
    return NextResponse.json(
      { success: false, data: null, error: { code: 'FORBIDDEN', message: 'This portal is for staff accounts only' } },
      { status: 403 },
    );
  }
  const res = NextResponse.json({ success: true, data: { user: body.data.user }, error: null });
  res.cookies.set(AT_COOKIE, body.data.accessToken, { ...base, maxAge: body.data.expiresIn });
  res.cookies.set(RT_COOKIE, body.data.refreshToken, { ...base, maxAge: 30 * 24 * 3600 });
  res.cookies.set('gum_admin', JSON.stringify({ name: body.data.user.fullName, roles: body.data.user.roles }), { ...base, httpOnly: false, maxAge: 30 * 24 * 3600 });
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const rt = cookies().get(RT_COOKIE)?.value;
  if (rt) await apiSend('POST', '/auth/logout', { refreshToken: rt }).catch(() => undefined);
  const res = NextResponse.json({ success: true, data: { message: 'Logged out' }, error: null });
  res.cookies.delete(AT_COOKIE); res.cookies.delete(RT_COOKIE); res.cookies.delete('gum_admin');
  return res;
}
