import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from 'react-router';
import { useRouteLoaderData } from 'react-router';
import { Wallet, ListChecks, Eye, MessageCircle, Package, Store, Sparkles, Plus, Truck, Gift, Coins } from 'lucide-react';
import { AreaChart, Spark, Delta } from '~/components/charts';
import { CountUp, stagger } from '~/components/motion';
import { api, formError } from '~/lib/api.server';
import { fcfa, img, QUARTERS, ORDER_STATUS, PAY } from '~/lib/format';
import { Alert, Field, PageTitle, Seg } from '~/components/ui';
import type { Cat } from '~/components/Shell';
import { Select } from '~/components/Select';

export const meta = () => [{ title: 'Ma Boutique | Sunu-Market' }];
export const handle = { title: 'Tableau De Bord' };
export async function loader({ request }: any) {
  const range = new URL(request.url).searchParams.get('periode') || '30';
  const [r, me] = await Promise.all([api(request, `/me/shop?range=${['7', '30', '365'].includes(range) ? range : '30'}`), api(request, '/me')]);
  return r.ok ? { ...r.data, firstName: me.data?.user?.firstName } : { shop: null };
}
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/me/shop', { json: { name: f.get('name'), description: f.get('description') || undefined, quarter: f.get('quarter') || undefined, universe: f.get('universe') ? Number(f.get('universe')) : undefined } });
  return r.ok ? redirect('/ma-boutique') : formError(r);
}
const PERIODS: [string, string][] = [['7', '7 Jours'], ['30', '30 Jours'], ['365', '12 Mois']];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const PAY_PILL: Record<string, string> = { wave: 'bg-[#E6F4FD] text-[#0A6CB5]', orange_money: 'bg-orange-50 text-orange-dark', cash: 'bg-sable-2 text-ink-2' };

export default function Dashboard() {
  const d = useLoaderData<typeof loader>() as any;
  if (!d.shop) return <CreateShop />;
  const s = d.stats;
  const monthly = d.range === 365;
  const labels = d.series.map((x: any) => monthly ? MONTHS[Number(x.day.slice(5, 7)) - 1] : String(Number(x.day.slice(8))));
  const cumul = (vs: number[]) => vs.reduce((a: number[], v) => [...a, (a.at(-1) || 0) + v], []);
  const sales = d.series.map((x: any) => x.sales);
  const orders = d.series.map((x: any) => x.orders);
  const sub = d.subscription;
  const daysLeft = sub ? Math.max(0, Math.ceil((new Date(sub.ends_at).getTime() - Date.now()) / 864e5)) : 0;
  const per = d.range === 7 ? 'ces 7 derniers jours' : d.range === 365 ? 'ces 12 derniers mois' : 'ces 30 derniers jours';
  const todo = [
    s.meetings_today > 0 && { icon: Truck, tone: 'bg-orange-50 text-orange', t: `${s.meetings_today} remise${s.meetings_today > 1 ? 's' : ''} aujourd’hui`, sub: 'Lieux et horaires dans vos commandes', to: '/ma-boutique/commandes', cta: 'Voir' },
    s.new_orders > 0 && { icon: ListChecks, tone: 'bg-orange-50 text-orange', t: `${s.new_orders} nouvelle${s.new_orders > 1 ? 's' : ''} commande${s.new_orders > 1 ? 's' : ''}`, sub: 'À accepter ou refuser', to: '/ma-boutique/commandes', cta: 'Traiter' },
    sub?.kind === 'trial' && { icon: Gift, tone: 'bg-[#FDF3D7] text-[#8A5A00]', t: `Essai : ${daysLeft} jours restants`, sub: 'Abonnement annuel 2 500 FCFA', to: '/ma-boutique/abonnement', cta: 'Activer' },
    s.unread_messages > 0 && { icon: MessageCircle, tone: 'bg-indigo-50 text-indigo', t: `${s.unread_messages} message${s.unread_messages > 1 ? 's' : ''} non lu${s.unread_messages > 1 ? 's' : ''}`, sub: 'Dans SM-Chat', to: '/ma-boutique/sm-chat', cta: 'Lire' },
    s.low_stock > 0 && { icon: Package, tone: 'bg-red-50 text-red-700', t: `${s.low_stock} annonce${s.low_stock > 1 ? 's' : ''} en stock bas`, sub: '3 articles ou moins', to: '/ma-boutique/annonces?filtre=stock-bas', cta: 'Voir' },
    { icon: Coins, tone: 'bg-indigo-50 text-indigo', t: `Crédits SM-IA : ${d.credits.toLocaleString('fr-FR')}`, sub: 'Facturation à l’usage réel', to: '/ma-boutique/sm-ia/recharger', cta: 'Recharger' },
  ].filter(Boolean) as any[];
  const topMax = Math.max(1, ...d.top.map((l: any) => l.sold || l.views));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="animate-fade-up"><h2 className="font-display text-2xl md:text-[26px] font-semibold text-ink">Bonjour {d.firstName}</h2><p className="text-[13.5px] text-muted">L’activité de votre boutique {per}.</p></div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Seg items={PERIODS.map(([k, l]) => ({ label: l, to: `?periode=${k}`, on: String(d.range) === k }))} />
          <Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className="btn-primary h-10 shadow-[0_6px_16px_-8px_rgb(201_67_16/.7)]"><Plus className="size-4" />Poser Une Annonce</Link>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <Kpi i={0} icon={Wallet} tone="bg-orange-50 text-orange" label="Ventes confirmées" value={s.sales} unit="FCFA" delta={<Delta now={s.sales} before={s.sales_prev} />} spark={sales} />
        <Kpi i={1} icon={ListChecks} tone="bg-indigo-50 text-indigo" label="Commandes" value={s.orders} delta={<Delta now={s.orders} before={s.orders_prev} />} spark={orders} />
        <Kpi i={2} icon={Eye} tone="bg-turquoise-50 text-turquoise" label="Vues des annonces" value={s.views} note={`${s.active_listings} annonce${s.active_listings > 1 ? 's' : ''} en ligne`} />
        <Kpi i={3} icon={MessageCircle} tone="bg-[#FDF3D7] text-[#8A5A00]" label="Messages SM-Chat" value={s.messages} note={s.messages ? `dont ${Math.round((s.messages_ai / Math.max(1, s.messages)) * 100)} % traités par SM-IA` : 'Aucun message sur la période'} />
      </div>
      <div className="grid xl:grid-cols-[1.75fr_1fr] gap-4">
        <div className="card p-5" data-reveal="">
          <div className="flex flex-wrap justify-between gap-2 items-start">
            <div><h3 className="font-display font-semibold text-ink">Ventes Confirmées</h3><p className="text-xs text-muted">Cumul des commandes terminées, payées directement à vous</p></div>
            <div className="flex gap-3 text-[11.5px] text-muted"><span className="flex items-center gap-1.5"><i className="w-4 h-0.5 bg-orange rounded" />Période</span><span className="flex items-center gap-1.5"><i className="w-4 border-t-2 border-dashed border-[#9AA0B8]" />Précédente</span></div>
          </div>
          <div className="mt-3"><AreaChart values={cumul(sales)} prev={cumul(d.series.map((x: any) => x.prev))} labels={labels} label={`Cumul des ventes confirmées ${per}`} /></div>
        </div>
        <div className="card p-5" data-reveal="right">
          <div className="flex justify-between items-center mb-3"><h3 className="font-display font-semibold text-ink">À Faire Aujourd’hui</h3><span className="chip bg-orange-50 text-orange-dark">{todo.length}</span></div>
          <ul className="space-y-1">
            {todo.slice(0, 4).map((t, i) => (
              <li key={i} className="flex items-center gap-3 py-2">
                <span className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${t.tone}`}><t.icon className="size-[18px]" /></span>
                <div className="flex-1 min-w-0"><p className="text-[13.5px] font-semibold text-ink">{t.t}</p><p className="text-[11.5px] text-muted">{t.sub}</p></div>
                <Link prefetch="intent" to={t.to} className="btn btn-sm bg-indigo-50 text-indigo hover:bg-indigo-100">{t.cta}</Link>
              </li>
            ))}
          </ul>
          <Link prefetch="intent" to="/ma-boutique/sm-ia/commandes" className="mt-3 flex items-center gap-3 rounded-xl bg-turquoise-50 p-3">
            <Sparkles className="size-5 text-turquoise" />
            <div className="flex-1"><p className="text-[13px] font-semibold text-ink">SM-IA Commandes {d.aiOrders ? 'actif' : 'inactif'}</p><p className="text-[11.5px] text-muted">{s.ai_orders_week} commande{s.ai_orders_week > 1 ? 's' : ''} acceptée{s.ai_orders_week > 1 ? 's' : ''} cette semaine</p></div>
            <span className={`relative w-10 h-[22px] rounded-full ${d.aiOrders ? 'bg-turquoise' : 'bg-line'}`} aria-hidden><span className={`absolute top-[3px] size-4 rounded-full bg-white shadow transition-transform ${d.aiOrders ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} /></span>
          </Link>
        </div>
      </div>
      <div className="grid xl:grid-cols-[1.75fr_1fr] gap-4">
        <div className="card overflow-hidden" data-reveal="">
          <div className="flex justify-between items-center px-5 pt-5 pb-3"><h3 className="font-display font-semibold text-ink">Dernières Commandes</h3><Link prefetch="intent" to="/ma-boutique/commandes" className="text-[13px] text-orange font-semibold">Voir Tout</Link></div>
          {d.recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[560px]">
                <thead className="bg-sable text-[11.5px] text-muted"><tr><th className="text-left font-medium px-5 py-2">Client</th><th className="text-left font-medium">Article</th><th className="text-left font-medium">Paiement convenu</th><th className="text-left font-medium">État</th><th className="text-right font-medium px-5">Montant</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {d.recent.map((o: any, i: number) => (
                    <tr key={o.id} className="hover:bg-sable/50">
                      <td className="px-5 py-3"><Link prefetch="intent" to={`/commandes/${o.id}`} className="flex items-center gap-2.5">
                        <span className={`size-8 rounded-full text-white text-[11px] font-semibold flex items-center justify-center ${['bg-orange', 'bg-turquoise', 'bg-indigo'][i % 3]}`}>{o.first_name[0]}{o.last_name[0]}</span>
                        <span><b className="block font-semibold">{o.first_name} {o.last_name[0]}.</b><span className="text-[11px] text-muted">{o.ref}</span></span></Link></td>
                      <td className="max-w-[220px] truncate">{o.title_snapshot}{o.quantity > 1 ? ` x${o.quantity}` : ''}</td>
                      <td><span className={`chip ${PAY_PILL[o.pay_method]}`}>{PAY[o.pay_method]}</span></td>
                      <td><span className={`chip ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span></td>
                      <td className="text-right px-5 font-semibold whitespace-nowrap">{fcfa(o.total_fcfa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="px-5 pb-5 text-sm text-muted">Aucune commande pour l’instant. Partagez votre boutique : <Link to={`/b/${d.shop.slug}`} className="underline">/b/{d.shop.slug}</Link></p>}
        </div>
        <div className="card p-5" data-reveal="right">
          <div className="flex justify-between items-center mb-3"><h3 className="font-display font-semibold text-ink">Meilleures Ventes</h3><Link prefetch="intent" to="/ma-boutique/annonces" className="text-[13px] text-orange font-semibold">Tout Voir</Link></div>
          {d.top.length ? (
            <ul className="space-y-3.5">
              {d.top.map((l: any, i: number) => {
                const v = l.sold || l.views;
                return (
                  <li key={l.id} className="flex items-center gap-3">
                    <img src={img(l.photo)} alt="" className="size-10 rounded-lg object-cover bg-sable-2" />
                    <div className="flex-1 min-w-0">
                      <Link prefetch="intent" to={`/a/${l.id}`} className="text-[13px] font-semibold truncate block hover:underline">{l.title}</Link>
                      <div className="h-1.5 rounded-full bg-sable-2 mt-1.5 overflow-hidden"><span className={`block h-full rounded-full bar-x ${['bg-orange', 'bg-indigo', 'bg-turquoise'][i % 3]}`} style={{ width: `${(v / topMax) * 100}%`, animationDelay: `${i * 80}ms` }} /></div>
                    </div>
                    <span className="text-[13px] font-semibold w-12 text-right" title={l.sold ? 'Vendus' : 'Vues'}>{v}<span className="block text-[10px] text-muted font-normal">{l.sold ? 'vendus' : 'vues'}</span></span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-muted flex items-center gap-2"><Package className="size-4" />Publiez votre première annonce pour la voir ici.</p>}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, tone, label, value, unit, delta, note, spark, i = 0 }: any) {
  return (
    <div className="card p-4 md:p-5" {...stagger(i)}>
      <p className="text-[13px] text-muted flex items-center gap-2"><span className={`size-8 rounded-[10px] flex items-center justify-center ${tone}`}><Icon className="size-4" /></span>{label}</p>
      <p className="font-display text-2xl md:text-[30px] font-semibold text-ink mt-3 leading-none"><CountUp value={Number(value) || 0} />{unit && <span className="text-[13px] font-medium text-muted ml-1">{unit}</span>}</p>
      <div className="flex items-end justify-between gap-2 mt-3 min-h-7">
        {delta || <span className="text-[11.5px] text-muted">{note}</span>}
        {spark && <Spark values={spark} />}
      </div>
    </div>
  );
}

function CreateShop() {
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const { cats } = useRouteLoaderData('root') as { cats: Cat[] };
  return (
    <div className="max-w-xl">
      <PageTitle title="Ouvrir Ma Boutique" sub="Louez votre espace dans le centre commercial Sunu-Market. Essai gratuit de 14 jours, puis 2 500 FCFA par an." />
      <Form method="post" className="card p-6 space-y-4">
        {a?.error && <Alert>{a.error}</Alert>}
        <Field label="Nom De La Boutique" name="name" required minLength={3} maxLength={60} error={a?.fields?.name} placeholder="Ex. Atelier Awa Couture" />
        <Field label="Description"><textarea name="description" rows={3} maxLength={600} className="input h-auto py-2" placeholder="Ce que vous vendez, vos points forts." /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quartier"><Select name="quarter" defaultValue={QUARTERS[0]} aria-label="Quartier" options={QUARTERS} /></Field>
          <Field label="Univers Principal"><Select name="universe" required placeholder="Choisir l’univers" aria-label="Univers principal" options={cats.filter((c) => !c.is_shops).map((c) => ({ value: String(c.id), label: c.name }))} /></Field>
        </div>
        <button className="btn-primary w-full" disabled={busy}><Store className="size-4" />Créer Ma Boutique Et Démarrer L’Essai</button>
        <p className="text-xs text-muted">Acheter reste gratuit. L’abonnement concerne uniquement la boutique.</p>
      </Form>
    </div>
  );
}
