import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AT_COOKIE, RT_COOKIE } from '@/lib/serverApi';

const API = process.env.API_URL ?? 'http://localhost:4000';

interface Rotated { at: string; rt: string; maxAge: number }

/**
 * Same-origin API proxy for CLIENT components: attaches the httpOnly access
 * token, and on 401 transparently rotates the refresh token and retries.
 * Tokens never touch browser JS (XSS-safe by construction).
 *
 * Refresh is SERIALISED per refresh-token. After the ~15-min access cookie
 * expires, a page often fires several authed requests at once; the server
 * rotates refresh tokens with reuse-detection (presenting a rotated token again
 * revokes the WHOLE session), so a naive per-request refresh races and logs the
 * user out. Sharing one in-flight refresh — and keeping its result for a short
 * grace window so stragglers carrying the old token reuse it — avoids that.
 */
const refreshing = new Map<string, Promise<Rotated | null>>();

function refreshOnce(rt: string): Promise<Rotated | null> {
  const inflight = refreshing.get(rt);
  if (inflight) return inflight;
  const p = (async (): Promise<Rotated | null> => {
    try {
      const refresh = await fetch(`${API}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
        cache: 'no-store',
      });
      const body = (await refresh.json()) as { success: boolean; data?: { accessToken: string; refreshToken: string; expiresIn: number } };
      if (body.success && body.data) return { at: body.data.accessToken, rt: body.data.refreshToken, maxAge: body.data.expiresIn };
      return null;
    } catch {
      return null;
    }
  })();
  refreshing.set(rt, p);
  // Keep the resolved refresh around briefly so late requests still holding the
  // old token reuse it instead of presenting the now-rotated token again.
  void p.finally(() => { setTimeout(() => { if (refreshing.get(rt) === p) refreshing.delete(rt); }, 10_000); });
  return p;
}

async function forward(req: NextRequest, params: { path: string[] }): Promise<NextResponse> {
  const target = `${API}/v1/${params.path.join('/')}${req.nextUrl.search}`;
  const bodyText = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();

  const call = async (token: string | undefined): Promise<Response> =>
    fetch(target, {
      method: req.method,
      headers: {
        ...(req.headers.get('content-type') ? { 'content-type': req.headers.get('content-type') as string } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: bodyText,
      cache: 'no-store',
    });

  let token = cookies().get(AT_COOKIE)?.value;
  let upstream = await call(token);

  let rotated: Rotated | null = null;
  const rt = cookies().get(RT_COOKIE)?.value;
  if (upstream.status === 401 && rt) {
    rotated = await refreshOnce(rt);
    if (rotated) {
      token = rotated.at;
      upstream = await call(token);
    }
  }

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
  if (rotated) {
    const base = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
    res.cookies.set(AT_COOKIE, rotated.at, { ...base, maxAge: rotated.maxAge });
    res.cookies.set(RT_COOKIE, rotated.rt, { ...base, maxAge: 30 * 24 * 3600 });
  }
  return res;
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }): Promise<NextResponse> { return forward(req, ctx.params); }
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }): Promise<NextResponse> { return forward(req, ctx.params); }
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }): Promise<NextResponse> { return forward(req, ctx.params); }
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }): Promise<NextResponse> { return forward(req, ctx.params); }
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }): Promise<NextResponse> { return forward(req, ctx.params); }
