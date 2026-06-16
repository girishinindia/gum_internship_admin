import Link from 'next/link';
import { apiGet } from '@/lib/serverApi';
import { inr } from '@/lib/format';

export const dynamic = 'force-dynamic';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Stats = Record<string, any>;

const QUEUE_LINKS: Record<string, string> = {
  reviews: '/moderation/internships', kyc: '/moderation/kyc', moderation: '/moderation/internships',
  refunds: '/finance/refunds', tickets: '/tickets',
};

export default async function DashboardPage(): Promise<JSX.Element> {
  const { data: s } = await apiGet<Stats>('/admin/dashboard', { auth: true });
  const cards = [
    { label: 'Signups (30d)', value: s.signups.last30d, sub: `${s.signups.today} today` },
    { label: 'Enrollments (30d)', value: s.enrollments.last30d, sub: `${s.enrollments.today} today` },
    { label: 'Revenue (30d)', value: inr(s.revenue.last30d), sub: `${inr(s.revenue.today)} today` },
    { label: 'Completion rate', value: s.completionRatePercent === null ? '—' : `${s.completionRatePercent}%`, sub: 'active + completed' },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-h1">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-caption uppercase text-neutral-600">{c.label}</p>
            <p className="mt-1 font-heading text-h1">{c.value}</p>
            <p className="text-body-sm text-neutral-500">{c.sub}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-h3">Pending actions</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {Object.entries(s.pending as Record<string, number>).map(([k, v]) => (
            <Link key={k} href={QUEUE_LINKS[k] ?? '#'} className={`card p-4 transition hover:shadow-e1 ${Number(v) > 0 ? 'border-warning-300 bg-warning-50' : ''}`}>
              <p className="font-heading text-h2">{v}</p>
              <p className="text-body-sm capitalize text-neutral-700">{k} →</p>
            </Link>
          ))}
        </div>
      </div>
      <p className="text-body-sm text-neutral-500">30-day revenue/enrollment charts (recharts) land in session 4.4.</p>
    </div>
  );
}
