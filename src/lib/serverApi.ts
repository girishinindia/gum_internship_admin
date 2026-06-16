import 'server-only';
import { cookies } from 'next/headers';
import type { Envelope } from './types';
import { ApiError } from './types';

const API = process.env.API_URL ?? 'http://localhost:4000';
// Distinct from the web app's gum_at/gum_rt: cookies ignore port, so on a shared
// host (localhost, or apex domain) the two apps would otherwise clobber each
// other's tokens and trip refresh-token reuse-detection. Keep admin names separate.
export const AT_COOKIE = 'gum_admin_at';
export const RT_COOKIE = 'gum_admin_rt';

/**
 * Server-side API access (RSC pages, route handlers).
 * Public fetches pass `revalidate` for ISR; authed fetches read the httpOnly
 * access-token cookie (refresh rotation lives in the /api/session handlers).
 */
export async function apiGet<T>(path: string, opts?: { revalidate?: number; auth?: boolean }): Promise<Envelope<T>> {
  const headers: Record<string, string> = {};
  if (opts?.auth) {
    const token = cookies().get(AT_COOKIE)?.value;
    if (token) headers.authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API}/v1${path}`, {
    headers,
    ...(opts?.revalidate !== undefined
      ? { next: { revalidate: opts.revalidate } }
      : { cache: 'no-store' }),
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) {
    throw new ApiError(body.error?.code ?? 'INTERNAL_ERROR', body.error?.message ?? 'Request failed', res.status, body.error?.details);
  }
  return body;
}

export async function apiSend<T>(method: string, path: string, payload: unknown, token?: string): Promise<{ status: number; body: Envelope<T> }> {
  const res = await fetch(`${API}/v1${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    cache: 'no-store',
  });
  return { status: res.status, body: (await res.json()) as Envelope<T> };
}
