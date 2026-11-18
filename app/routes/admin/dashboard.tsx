// P29 : vue d'ensemble de la plateforme
import { Link, useLoaderData } from 'react-router';
import { apiOrThrow } from '~/lib/api.server';
import { fcfa } from '~/lib/format';
import { PageTitle } from '~/components/ui';
import { CountUp, stagger } from '~/components/motion';

export const loader = ({ request }: any) => apiOrThrow(request, '/admin/stats');
const SRC: Record<string, [string, string]> = { subscription: ['Abonnements', '#1B2A6B'], featured: ['Mise En Avant', '#C94310'], campaign: ['Campagnes', '#0B7F7C'], ad: ['Publicité', '#E8A317'], credits: ['Commissions SM-IA', '#8A90A8'] };
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export default function AdminDashboard() {
  const { kpi: k, byCategory, signups, revenue } = useLoaderData<typeof loader>();
  const max = Math.max(1, ...byCategory.map((c: any) => c.n));
  const smax = Math.max(1, ...signups.map((s: any) => s.n));
  const rmax = Math.max(1, ...revenue.months.map((m: any) => m.total));
  const total = revenue.split.reduce((a: number, s: any) => a + s.amount, 0);
  let acc = 0;
  const cards: [string, number, string | null, boolean?][] = [
    ['Revenus Du Mois', k.revenue_month, '/admin/revenus', true], ['Comptes Vérifiés', k.verified_users, null], ['Vérifications En Attente', k.pending_verifications, '/admin/verifications'],
    ['Signalements Ouverts', k.open_reports, '/admin/signalements'], ['Boutiques', k.shops, '/admin/annonces?vue=boutiques'], ['Abonnées', k.paying_shops, null],
    ['Paiements À Vérifier', k.pending_payments, '/admin/revenus?statut=pending'], ['Annonces En Ligne', k.active_listings, '/admin/annonces?vue=toutes'],
  ];
  return (
    <>
      <PageTitle title="Tableau De Bord" sub="Sunu-Market encaisse uniquement ses services : abonnements, mise en avant, campagnes, publicité et commissions SM-IA." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(([l, v, to, money], i) => {
          const inner = <><p className="text-xs text-muted">{l}</p><p className="font-display text-2xl font-bold text-indigo mt-1"><CountUp value={v} format={money ? fcfa : undefined} /></p></>;
          return to ? <Link prefetch="intent" key={l} to={to} className="card p-4 lift" {...stagger(i, 50)}>{inner}</Link> : <div key={l} className="card p-4" {...stagger(i, 50)}>{inner}</div>;
        })}
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mt-6">
        <div className="card p-5" data-reveal="">
          <h2 className="font-display font-semibold text-indigo mb-4">Revenus Par Mois</h2>
          <div className="flex items-end gap-3 h-44">
            {revenue.months.map((m: any, i: number) => (
              <div key={m.month} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={fcfa(m.total)}>
                <span className="text-[10px] text-muted">{m.total ? fcfa(m.total).replace(' FCFA', '') : ''}</span>
                <span className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-indigo to-indigo/70" data-reveal="" style={{ height: `${Math.max(2, (m.total / rmax) * 100)}%`, '--d': `${i * 80}ms` } as React.CSSProperties} />
                <span className="text-[11px] text-muted">{MONTHS[Number(m.month.slice(5)) - 1]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5 flex flex-col" data-reveal="right">
          <h2 className="font-display font-semibold text-indigo mb-4">Répartition Des Revenus (6 Mois)</h2>
          <div className="flex items-center gap-5 flex-1">
            <svg viewBox="0 0 42 42" className="size-36 -rotate-90 shrink-0" role="img" aria-label="Répartition des revenus">
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--color-sable-dark)" strokeWidth="6" />
              {total > 0 && revenue.split.map((s: any) => { const pct = (s.amount / total) * 100; const el = <circle key={s.purpose} cx="21" cy="21" r="15.9" fill="none" stroke={SRC[s.purpose][1]} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-acc} className="transition-all duration-700" />; acc += pct; return el; })}
            </svg>
            <ul className="space-y-1.5 text-sm">
              {revenue.split.length ? revenue.split.map((s: any) => <li key={s.purpose} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: SRC[s.purpose][1] }} />{SRC[s.purpose][0]} <b className="ml-auto pl-3">{fcfa(s.amount)}</b></li>) : <li className="text-muted">Aucun paiement encaissé.</li>}
            </ul>
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5" data-reveal="">
          <h2 className="font-display font-semibold text-indigo mb-4">Annonces Par Catégorie</h2>
          <ul className="space-y-2">
            {byCategory.map((c: any, i: number) => (
              <li key={c.name} className="grid grid-cols-[140px_1fr_32px] items-center gap-2 text-sm">
                <span className="truncate">{c.name}</span>
                <span className="h-2.5 rounded-full bg-sable-dark overflow-hidden"><span className="block h-full bg-turquoise rounded-full origin-left" data-reveal="left" style={{ width: `${(c.n / max) * 100}%`, '--d': `${i * 40}ms` } as React.CSSProperties} /></span>
                <span className="text-right text-muted">{c.n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5" data-reveal="right">
          <h2 className="font-display font-semibold text-indigo mb-4">Inscriptions (14 Derniers Jours)</h2>
          <div className="flex items-end gap-1.5 h-40">
            {signups.map((s: any, i: number) => (
              <div key={s.day} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${s.day} : ${s.n}`}>
                <span className="text-[10px] text-muted">{s.n || ''}</span>
                <span className="w-full bg-orange rounded-t" data-reveal="" style={{ height: `${(s.n / smax) * 100}%`, minHeight: s.n ? 4 : 1, '--d': `${i * 30}ms` } as React.CSSProperties} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
