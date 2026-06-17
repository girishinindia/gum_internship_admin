import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Staff gate + server-side token refresh.
 *
 * Every route except /login requires a staff session. The access cookie lives
 * ~15 min; once the browser drops it, server-rendered admin pages would 401.
 * Middleware is the one place that can re-set cookies AND forward them to the
 * current render, so here we refresh using the refresh cookie — keeping the
 * console usable across the day without a re-login.
 */

const API = process.env.API_URL ?? 'http://localhost:4000';
const AT = 'gum_admin_at';
const RT = 'gum_admin_rt';

async function refresh(rt: string): Promise<{ at: string; rt: string; maxAge: number } | null> {
  try {
    const r = await fetch(`${API}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
      cache: 'no-store',
    });
    const j = (await r.json()) as { success: boolean; data?: { accessToken: string; refreshToken: string; expiresIn: number } };
    if (j.success && j.data) return { at: j.data.accessToken, rt: j.data.refreshToken, maxAge: j.data.expiresIn };
  } catch {
    // fall through → treated as no session
  }
  return null;
}

/** Replace (or add) one cookie in a raw Cookie header string. */
function withCookie(header: string, name: string, value: string): string {
  const parts = header ? header.split(/;\s*/).filter((p) => p && !p.startsWith(`${name}=`)) : [];
  parts.push(`${name}=${value}`);
  return parts.join('; ');
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const loggedIn = req.cookies.has(RT);

  // Public (no session needed): login + the password-reset flow.
  if (pathname === '/login' || pathname === '/forgot-password') {
    if (pathname === '/login' && loggedIn) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
  }
  if (!loggedIn) {
    const login = new URL('/login', req.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  // Access token expired (browser dropped it) but refresh token present → rotate.
  if (!req.cookies.has(AT)) {
    const rt = req.cookies.get(RT)?.value;
    const rotated = rt ? await refresh(rt) : null;
    if (rotated) {
      req.cookies.set(AT, rotated.at); // update the NextRequest store…
      const headers = new Headers(req.headers);
      headers.set('cookie', withCookie(req.headers.get('cookie') ?? '', AT, rotated.at)); // …and the raw header cookies() parses
      const res = NextResponse.next({ request: { headers } });
      const base = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
      res.cookies.set(AT, rotated.at, { ...base, maxAge: rotated.maxAge });
      res.cookies.set(RT, rotated.rt, { ...base, maxAge: 30 * 24 * 3600 });
      return res;
    }
    // refresh failed → session is dead; bounce to login.
    const login = new URL('/login', req.url);
    login.searchParams.set('next', pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete(RT);
    return res;
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next|favicon.ico).*)'] };
