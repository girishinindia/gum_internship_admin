'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';
import { InternshipForm } from '@/components/internships/InternshipForm';
import type { InternshipFormValues } from '@/components/internships/InternshipForm';

export default function NewInternshipPage(): JSX.Element {
  const router = useRouter();
  const toast = useToast();

  const create = async (values: InternshipFormValues): Promise<boolean> => {
    try {
      const { data } = await api<{ id: number }>('/internships', { method: 'POST', body: JSON.stringify(values) });
      toast('success', 'Internship created as draft.');
      router.push(`/internships/${data.id}`);
      return true;
    } catch (e) {
      toast('danger', e instanceof ApiError ? e.message : 'Could not create the internship.');
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/internships" className="text-body-sm text-primary-700 hover:underline">‹ Internships</Link>
      <div>
        <h1 className="text-h1">New internship</h1>
        <p className="text-body-sm text-neutral-600">It starts as a draft. Add curriculum and batches, then submit for review or publish.</p>
      </div>
      <InternshipForm mode="create" submitLabel="Create draft" onSubmit={create} />
    </div>
  );
}
