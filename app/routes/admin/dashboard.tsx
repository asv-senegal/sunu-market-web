// P29 : vue d'ensemble de la plateforme
import { Link, useLoaderData } from 'react-router';
import { apiOrThrow } from '~/lib/api.server';
import { REPORT_REASON } from '~/lib/format';
import { Wallet, BadgeCheck, CreditCard, ScanFace, Flag, Gift, Coins, Download } from 'lucide-react';
import { Bars, Donut, Spark, Delta } from '~/components/charts';
import { CountUp, stagger } from '~/components/motion';

export const handle = { title: 'Tableau De Bord' };
export const loader = ({ request }: any) => apiOrThrow(request, '/admin/stats');
const SRC: Record<string, [string, string]> = { subscription: ['Abonnements', '#1B2A6B'], featured: ['Mise En Avant', '#C94310'], campaign: ['Campagnes', '#0B7F7C'], ad: ['Publicité', '#E8A317'], credits: ['Commissions SM-IA', '#8A90A8'] };
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// Montant lisible : en millions à partir de 1 M FCFA, sinon le montant exact (2 500 FCFA, et non « 0,00 M »)
const money = (v: number) => {
  const n = Number(v || 0);
  return n >= 1e6
    ? { value: (n / 1e6).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: 'M FCFA' }
    : { value: Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' '), unit: 'FCFA' };
};

export default function AdminDashboard() {
  const { kpi: k, urgent, byCategory, signups, revenue } = useLoaderData<typeof loader>();
  const total = revenue.split.reduce((a: number, s: any) => a + s.amount, 0);
  const cats = [...byCategory].sort((a: any, b: any) => b.n - a.n).slice(0, 6);
  const cmax = Math.max(1, ...cats.map((c: any) => c.n));
  const pendingH = k.oldest_verification ? Math.round((Date.now() - new Date(k.oldest_verification).getTime()) / 36e5) : 0;
  const aiUp = k.ai_cost_prev ? Math.round(((k.ai_cost_week - k.ai_cost_prev) / k.ai_cost_prev) * 100) : null;
  const alerts = [
    urgent && { icon: Flag, tone: 'bg-red-50 text-red-700', t: `Signalement ${urgent.ref}${k.late_reports ? ' en retard' : ''}`, sub: `${REPORT_REASON[urgent.reason] || urgent.reason}, ${urgent.n} signalement${urgent.n > 1 ? 's' : ''} sur cet objet`, to: `/admin/signalements/${urgent.id}`, cta: 'Traiter' },
    k.pending_verifications > 0 && { icon: ScanFace, tone: 'bg-orange-50 text-orange', t: `${k.pending_verifications} vérification${k.pending_verifications > 1 ? 's' : ''} en attente`, sub: `Plus ancienne : ${pendingH} h, objectif 24 h [à confirmer]`, to: '/admin/verifications', cta: 'Ouvrir' },
    k.pending_payments > 0 && { icon: Wallet, tone: 'bg-indigo-50 text-indigo', t: `${k.pending_payments} paiement${k.pending_payments > 1 ? 's' : ''} à vérifier`, sub: 'Références déclarées par les commerçants', to: '/admin/revenus?statut=pending', cta: 'Vérifier' },
    k.trials_ending > 0 && { icon: Gift, tone: 'bg-[#FDF3D7] text-[#8A5A00]', t: `${k.trials_ending} essai${k.trials_ending > 1 ? 's' : ''} finissent cette semaine`, sub: 'Relance SMS des commerçants [à confirmer]', to: '/admin/annonces?vue=boutiques', cta: 'Voir' },
    aiUp != null && aiUp > 15 && { icon: Coins, tone: 'bg-indigo-50 text-indigo', t: 'Coût API SM-IA en hausse', sub: `+${aiUp} % sur 7 jours, marge à surveiller`, to: '/admin/sm-ia', cta: 'Analyser' },
  ].filter(Boolean) as any[];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="animate-fade-up"><h2 className="font-display text-2xl md:text-[26px] font-semibold text-ink">Vue D’Ensemble</h2>
          <p className="text-[13px] text-muted">{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date()).replace(/^./, (c) => c.toUpperCase())}. Sunu-Market encaisse uniquement ses services, jamais les ventes entre membres.</p></div>
        <a href="/exports/rapport.csv" className="btn-indigo h-10"><Download className="size-4" />Exporter Le Rapport</a>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <Kpi i={0} to="/admin/revenus" icon={Wallet} tone="bg-orange-50 text-orange" label="Revenus du mois" value={<>{money(k.revenue_month).value}<span className="text-[13px] font-medium text-muted ml-1">{money(k.revenue_month).unit}</span></>} foot={<Delta now={k.revenue_month} before={k.revenue_prev} />} spark={revenue.months.map((m: any) => m.total)} />
        <Kpi i={1} icon={BadgeCheck} tone="bg-turquoise-50 text-turquoise" label="Comptes vérifiés" value={<CountUp value={k.verified_users} />} foot={<span className="chip bg-turquoise-50 text-turquoise">↑ +{k.verified_30d}</span>} spark={signups.map((x: any) => x.n)} />
        <Kpi i={2} icon={CreditCard} tone="bg-indigo-50 text-indigo" label="Abonnés actifs" value={<CountUp value={k.paying_shops} />} foot={<span className="text-[11.5px] text-muted">{k.trial_shops} en essai de 14 jours</span>} />
        <Kpi i={3} to="/admin/verifications" icon={ScanFace} tone="bg-[#FDF3D7] text-[#8A5A00]" label="Vérifications en attente" value={<CountUp value={k.pending_verifications} />} foot={<span className="text-[11.5px] text-muted">{k.pending_verifications ? `plus ancienne : ${pendingH} h` : 'File vide'}</span>} />
        <Kpi i={4} to="/admin/signalements" icon={Flag} tone="bg-red-50 text-red-700" label="Signalements ouverts" value={<CountUp value={k.open_reports} />} foot={<span className="text-[11.5px] text-muted">{k.late_reports ? `${k.late_reports} en retard` : 'Aucun retard'}</span>} />
      </div>
      <div className="grid xl:grid-cols-[1.5fr_1fr] gap-4">
        <div className="card p-5" data-reveal="">
          <div className="flex justify-between items-baseline mb-4"><h3 className="font-display font-semibold text-ink">Revenus De La Plateforme</h3><span className="text-xs text-muted">en FCFA, 6 derniers mois</span></div>
          <Bars values={revenue.months.map((m: any) => m.total)} labels={revenue.months.map((m: any) => MONTHS[Number(m.month.slice(5)) - 1])} label="Revenus de la plateforme sur 6 mois" height={200} />
        </div>
        <div className="card p-5" data-reveal="right">
          <div className="flex justify-between items-center mb-2"><h3 className="font-display font-semibold text-ink">Alertes Prioritaires</h3><span className="chip bg-red-50 text-red-700">{alerts.length}</span></div>
          {alerts.length ? (
            <ul className="divide-y divide-line">
              {alerts.map((x, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5">
                  <span className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${x.tone}`}><x.icon className="size-[18px]" /></span>
                  <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-ink">{x.t}</p><p className="text-[11.5px] text-muted">{x.sub}</p></div>
                  <Link prefetch="intent" to={x.to} className="btn-ghost btn-sm">{x.cta}</Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted py-6 text-center">Rien d’urgent. Bonne journée !</p>}
        </div>
      </div>
      <div className="grid xl:grid-cols-[1fr_1.25fr] gap-4">
        <div className="card p-5" data-reveal="">
          <h3 className="font-display font-semibold text-ink mb-4">Répartition Des Revenus</h3>
          <div className="flex flex-wrap items-center gap-6">
            <Donut parts={revenue.split.map((s: any) => ({ value: s.amount, color: SRC[s.purpose][1], label: SRC[s.purpose][0] }))} center={revenue.split.length} sub="sources" />
            <ul className="flex-1 min-w-[180px] space-y-2 text-[13px]">
              {Object.entries(SRC).map(([key, [l, c]]) => {
                const v = revenue.split.find((s: any) => s.purpose === key)?.amount || 0;
                return <li key={key} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: c }} />{l}<b className="ml-auto">{total ? Math.round((v / total) * 100) : 0} %</b></li>;
              })}
            </ul>
          </div>
        </div>
        <div className="card p-5" data-reveal="right">
          <h3 className="font-display font-semibold text-ink mb-4">Annonces Publiées Par Catégorie</h3>
          <ul className="space-y-2.5">
            {cats.map((c: any, i: number) => (
              <li key={c.name} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-[13px]">
                <span className="truncate text-ink-2">{c.name}</span>
                <span className="h-2 rounded-full bg-sable-2 overflow-hidden"><span className="block h-full bg-orange rounded-full bar-x" style={{ width: `${(c.n / cmax) * 100}%`, animationDelay: `${i * 60}ms` }} /></span>
                <b className="text-right">{c.n.toLocaleString('fr-FR')}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, tone, label, value, foot, spark, to, i }: any) {
  const inner = (
    <>
      <p className="text-[13px] text-muted flex items-center gap-2"><span className={`size-8 rounded-[10px] flex items-center justify-center shrink-0 ${tone}`}><Icon className="size-4" /></span><span className="leading-tight">{label}</span></p>
      <p className="font-display text-[28px] font-semibold text-ink mt-3 leading-none">{value}</p>
      <div className="flex items-end justify-between gap-2 mt-3 min-h-7">{foot}{spark && <Spark values={spark} w={70} />}</div>
    </>
  );
  return to ? <Link prefetch="intent" to={to} className="card p-4 hover:-translate-y-0.5 transition-transform" {...stagger(i, 50)}>{inner}</Link> : <div className="card p-4" {...stagger(i, 50)}>{inner}</div>;
}
