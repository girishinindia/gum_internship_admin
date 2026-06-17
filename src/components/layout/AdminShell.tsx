'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export interface AdminIdentity {
  name: string;
  roles: string[];
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: string[]; // which roles see this item (super_admin always does)
}

/** RBAC-aware navigation: items are filtered by the admin's roles. */
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', roles: ['moderator', 'finance_admin', 'support'] },
  { href: '/analytics', label: 'Analytics', icon: '◷', roles: ['moderator', 'finance_admin', 'support'] },
  { href: '/moderation/kyc', label: 'Instructor KYC', icon: '☑', roles: ['moderator'] },
  { href: '/instructors', label: 'Instructors', icon: '✦', roles: ['moderator', 'finance_admin'] },
  { href: '/internships', label: 'Internships', icon: '◫', roles: ['moderator'] },
  { href: '/users', label: 'Users', icon: '⚇', roles: ['moderator', 'support'] },
  { href: '/enrollments', label: 'Enrollment ops', icon: '↹', roles: ['moderator', 'support'] },
  { href: '/finance/orders', label: 'Orders', icon: '₹', roles: ['finance_admin'] },
  { href: '/finance/refunds', label: 'Refunds', icon: '↩', roles: ['finance_admin'] },
  { href: '/finance/settlements', label: 'Settlements', icon: '⇄', roles: ['finance_admin'] },
  { href: '/coupons', label: 'Coupons', icon: '✁', roles: ['finance_admin', 'moderator'] },
  { href: '/tickets', label: 'Support tickets', icon: '✉', roles: ['support', 'moderator', 'finance_admin'] },
  { href: '/cms', label: 'CMS', icon: '▤', roles: ['moderator'] },
  { href: '/audit', label: 'Audit log', icon: '☰', roles: ['moderator'] },
];

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-danger-50 text-danger-700',
  moderator: 'bg-primary-50 text-primary-700',
  finance_admin: 'bg-success-50 text-success-700',
  support: 'bg-warning-50 text-warning-700',
};

export function AdminShell({ identity, children }: { identity: AdminIdentity; children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const isSuper = identity.roles.includes('super_admin');
  const visible = NAV.filter((n) => isSuper || n.roles.some((r) => identity.roles.includes(r)));
  const primaryRole = isSuper ? 'super_admin' : identity.roles.find((r) => ROLE_BADGE[r]) ?? identity.roles[0];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} sticky top-0 flex h-screen flex-col border-r border-neutral-200 bg-white transition-all`}>
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
          {!collapsed && <span className="font-heading font-semibold text-primary-600">GUM Admin</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-neutral-500 hover:text-neutral-900" aria-label="Toggle sidebar">
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {visible.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} title={n.label}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium ${active ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-100'}`}>
                <span aria-hidden>{n.icon}</span>
                {!collapsed && n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <p className="text-body-sm text-neutral-600">Every mutation here is written to the audit log.</p>
          <div className="flex items-center gap-3">
            <span className={`badge ${ROLE_BADGE[primaryRole ?? ''] ?? 'bg-neutral-100 text-neutral-700'}`}>{primaryRole}</span>
            <span className="text-body-sm font-medium">{identity.name}</span>
            <Link href="/security" className="text-body-sm text-neutral-500 hover:text-neutral-900">Security</Link>
            <button
              className="text-body-sm text-neutral-500 hover:text-danger-600"
              onClick={async () => { await fetch('/api/session', { method: 'DELETE' }); router.push('/login'); router.refresh(); }}>
              Log out
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
