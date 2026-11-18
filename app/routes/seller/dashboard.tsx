import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from 'react-router';
import { useRouteLoaderData } from 'react-router';
import { Wallet, ClipboardList, Eye, MessageCircle, Package, Store, Sparkles } from 'lucide-react';
import { CountUp, stagger } from '~/components/motion';
import { api, formError } from '~/lib/api.server';
import { fcfa, img, QUARTERS } from '~/lib/format';
import { Alert, Field, PageTitle } from '~/components/ui';
import type { Cat } from '~/components/Shell';
import { Select } from '~/components/Select';

export const meta = () => [{ title: 'Ma Boutique | Sunu-Market' }];
export async function loader({ request }: any) {
  const r = await api(request, '/me/shop');
  return r.ok ? r.data : { shop: null };
}
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/me/shop', { json: { name: f.get('name'), description: f.get('description') || undefined, quarter: f.get('quarter') || undefined, universe: f.get('universe') ? Number(f.get('universe')) : undefined } });
  return r.ok ? redirect('/ma-boutique') : formError(r);
}

export default function Dashboard() {
  const d = useLoaderData<typeof loader>() as any;
  if (!d.shop) return <CreateShop />;
  const s = d.stats;
  return (
    <>
      <PageTitle title="Tableau De Bord" sub="Ventes confirmées par vos acheteurs. Sunu-Market ne prend aucune commission.">
        <Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className="btn-primary">Poser Une Annonce</Link>
      </PageTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi i={0} icon={Wallet} label="Ventes (30 Jours)" value={s.sales_30d} money />
        <Kpi i={1} icon={ClipboardList} label="Commandes En Cours" value={s.open_orders} note={s.new_orders ? `${s.new_orders} nouvelle(s)` : undefined} />
        <Kpi i={2} icon={Eye} label="Vues Des Annonces" value={s.views} />
        <Kpi i={3} icon={MessageCircle} label="Messages Non Lus" value={s.unread_messages} />
      </div>
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 mt-4">
        <div className="card p-5" data-reveal="">
          <div className="flex justify-between items-baseline"><h2 className="font-display font-semibold text-indigo">Ventes Confirmées (14 Jours)</h2><span className="text-xs text-muted">payées directement par les acheteurs</span></div>
          <SalesChart series={d.series} />
        </div>
        <Link prefetch="intent" to="/ma-boutique/sm-ia" className="card p-5 bg-indigo text-white border-indigo lift" data-reveal="right">
          <p className="flex items-center gap-2 text-white/80 text-sm"><Sparkles className="size-4" />Crédits SM-IA</p>
          <p className="font-display text-4xl font-bold mt-2"><CountUp value={d.credits} /></p>
          <p className="text-sm text-white/70 mt-1">Rédaction d’annonces, réponses automatiques dans SM-Chat et conseils.</p>
          <span className="btn-primary btn-sm mt-4 w-fit">Ouvrir L’Assistant</span>
        </Link>
      </div>
      {s.new_orders > 0 && <div className="mt-4"><Alert tone="info">Vous avez {s.new_orders} nouvelle(s) commande(s). <Link prefetch="intent" to="/ma-boutique/commandes" className="underline font-semibold">Les traiter</Link></Alert></div>}
      <div className="card mt-6 p-5">
        <div className="flex justify-between items-center mb-3"><h2 className="font-display font-semibold text-indigo">Meilleures Annonces</h2><Link prefetch="intent" to="/ma-boutique/annonces" className="text-sm text-orange font-semibold">Tout Voir</Link></div>
        {d.top.length ? (
          <ul className="divide-y divide-sable-dark">
            {d.top.map((l: any) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <img src={img(l.photo)} alt="" className="size-11 rounded-lg object-cover" />
                <Link prefetch="intent" to={`/a/${l.id}`} className="flex-1 text-sm font-medium truncate hover:underline">{l.title}</Link>
                <span className="text-xs text-muted">{l.views} vues · {l.sold} vendus</span>
                <span className="text-sm font-semibold w-28 text-right">{fcfa(l.price_fcfa)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted flex items-center gap-2"><Package className="size-4" />Publiez votre première annonce pour la voir ici.</p>}
      </div>
      <p className="text-xs text-muted mt-4">Votre vitrine publique : <Link prefetch="intent" to={`/b/${d.shop.slug}`} className="underline">/b/{d.shop.slug}</Link></p>
    </>
  );
}

function SalesChart({ series }: { series: any[] }) {
  const max = Math.max(1, ...series.map((x) => x.sales));
  return (
    <div className="flex items-end gap-1.5 h-40 mt-4" role="img" aria-label="Ventes des 14 derniers jours">
      {series.map((x, i) => (
        <div key={x.day} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group" title={`${x.day} : ${fcfa(x.sales)}, ${x.orders} commande(s)`}>
          <span className="text-[9px] text-muted opacity-0 group-hover:opacity-100 transition-opacity">{x.sales ? Math.round(x.sales / 1000) + 'k' : ''}</span>
          <span className="w-full rounded-t-md bg-gradient-to-t from-orange to-orange/70 origin-bottom transition-transform duration-700" data-reveal="" style={{ height: `${Math.max(2, (x.sales / max) * 100)}%`, '--d': `${i * 40}ms` } as React.CSSProperties} />
          <span className="text-[9px] text-muted">{x.day.slice(8)}</span>
        </div>
      ))}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, note, money, i = 0 }: any) {
  return (
    <div className="card p-4 lift" {...stagger(i)}>
      <p className="text-xs text-muted flex items-center gap-1.5"><Icon className="size-4 text-turquoise" />{label}</p>
      <p className="font-display text-2xl font-bold text-indigo mt-1"><CountUp value={Number(value) || 0} format={money ? fcfa : undefined} /></p>
      {note && <p className="text-xs text-orange-dark">{note}</p>}
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
