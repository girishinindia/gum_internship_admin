import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AT_COOKIE, RT_COOKIE } from '@/lib/serverApi';

const API = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Same-origin API proxy for CLIENT components: attaches the httpOnly access
 * token, and on 401 transparently rotates the refresh token ONCE and retries.
 * Tokens never touch browser JS (XSS-safe by construction).
 */
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

  let rotated: { at: string; rt: string; maxAge: number } | null = null;
  if (upstream.status === 401 && cookies().get(RT_COOKIE)?.value) {
    const refresh = await fetch(`${API}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: cookies().get(RT_COOKIE)?.value }),
      cache: 'no-store',
    });
    const rBody = (await refresh.json()) as { success: boolean; data?: { accessToken: string; refreshToken: string; expiresIn: number } };
    if (rBody.success && rBody.data) {
      token = rBody.data.accessToken;
      rotated = { at: rBody.data.accessToken, rt: rBody.data.refreshToken, maxAge: rBody.data.expiresIn };
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
