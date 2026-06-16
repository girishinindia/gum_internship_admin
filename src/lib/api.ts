'use client';
import type { Envelope } from './types';
import { ApiError } from './types';

/**
 * CLIENT-side typed API wrapper. Talks to the same-origin /api/proxy/* which
 * attaches httpOnly tokens and auto-refreshes on 401 (see route handler).
 */
export async function api<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.success) {
    throw new ApiError(body.error?.code ?? 'INTERNAL_ERROR', body.error?.message ?? 'Request failed', res.status, body.error?.details);
  }
  return body;
}
