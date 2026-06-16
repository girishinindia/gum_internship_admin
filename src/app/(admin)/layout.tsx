import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/layout/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const raw = cookies().get('gum_admin')?.value;
  if (!raw) redirect('/login');
  const identity = JSON.parse(raw) as { name: string; roles: string[] };
  return <AdminShell identity={identity}>{children}</AdminShell>;
}
