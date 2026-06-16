'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

/**
 * Audit-aware mutation hook: wraps a proxy call with busy state, toasts, and
 * the "this action is logged" affordance for confirm dialogs.
 */
export function useAuditMutation(): {
  busy: boolean;
  run: (method: string, path: string, body?: unknown, successMsg?: string) => Promise<boolean>;
  auditNotice: string;
} {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return {
    busy,
    auditNotice: 'This action is written to the audit log with your identity.',
    async run(method, path, body, successMsg) {
      setBusy(true);
      try {
        await api(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
        toast('success', successMsg ?? 'Done');
        return true;
      } catch (e) {
        toast('danger', e instanceof ApiError ? e.message : 'Action failed');
        return false;
      } finally {
        setBusy(false);
      }
    },
  };
}
