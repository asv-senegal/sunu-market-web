// P13 : Mes Commandes, onglets Mes Achats et Mes Ventes
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { apiOrThrow, requireMe } from '~/lib/api.server';
import { fcfa, img, ORDER_STATUS, PAY, dateFr } from '~/lib/format';
import { Empty } from '~/components/ui';
import { stagger } from '~/components/motion';

export const meta = () => [{ title: 'Mes Commandes | Sunu-Market' }];
export async function loader({ request }: any) {
  const me = await requireMe(request);
  const role = new URL(request.url).searchParams.get('vue') === 'ventes' && me.shop ? 'seller' : 'buyer';
  const [buy, sell] = await Promise.all([apiOrThrow(request, '/orders?role=buyer'), me.shop ? apiOrThrow(request, '/orders?role=seller') : { items: [] }]);
  return { role, buy: buy.items, sell: sell.items, hasShop: !!me.shop };
}
const FILTERS: [string, string, (o: any) => boolean][] = [
  ['toutes', 'Toutes', () => true], ['en-cours', 'En Cours', (o) => ['new', 'accepted', 'scheduled'].includes(o.status)],
  ['terminees', 'Terminées', (o) => ['completed', 'declined', 'cancelled'].includes(o.status)],
];

export default function Orders() {
  const { role, buy, sell, hasShop } = useLoaderData<typeof loader>();
  const [sp] = useSearchParams();
  const f = FILTERS.find(([k]) => k === sp.get('filtre')) || FILTERS[0];
  const items = (role === 'seller' ? sell : buy).filter(f[2]);
  const q = (o: Record<string, string>) => { const n = new URLSearchParams(sp); Object.entries(o).forEach(([k, v]) => n.set(k, v)); return `?${n}`; };
  return (
    <div className="container-x py-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-indigo animate-fade-up">Mes Commandes</h1>
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white border border-sable-dark text-sm font-semibold">
          <Link prefetch="intent" to={q({ vue: 'achats' })} className={`px-4 py-2 rounded-lg transition-colors ${role === 'buyer' ? 'bg-indigo text-white' : 'text-muted'}`}>Mes Achats ({buy.length})</Link>
          {hasShop ? <Link prefetch="intent" to={q({ vue: 'ventes' })} className={`px-4 py-2 rounded-lg transition-colors ${role === 'seller' ? 'bg-indigo text-white' : 'text-muted'}`}>Mes Ventes ({sell.length})</Link>
            : <Link prefetch="intent" to="/ma-boutique" className="px-4 py-2 rounded-lg text-muted">Mes Ventes</Link>}
        </div>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {FILTERS.map(([k, l]) => <Link prefetch="intent" key={k} to={q({ filtre: k })} className={`chip whitespace-nowrap py-1.5 px-3 ${f[0] === k ? 'bg-orange text-white' : 'bg-white border border-sable-dark'}`}>{l}</Link>)}
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((o: any, i: number) => {
            const st = ORDER_STATUS[o.status];
            return (
              <Link prefetch="intent" key={o.id} to={`/commandes/${o.id}`} viewTransition className="card p-4 flex gap-4 items-center lift" {...stagger(i, 50)}>
                <img src={img(o.photo)} alt="" className="size-16 md:size-[72px] rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold truncate">{o.title_snapshot}</p><span className={`chip ${st.cls}`}>{st.label}</span></div>
                  <p className="text-xs text-muted mt-0.5">Commande {o.ref}, {role === 'buyer' ? o.shop_name : o.buyer_name} · {dateFr(o.created_at)}</p>
                  <p className="text-xs text-muted">{o.meeting_place ? `Rendez-vous : ${o.meeting_place}` : `Paiement direct : ${PAY[o.pay_method]}`}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-indigo">{fcfa(o.total_fcfa)}</p>
                  <span className="text-xs text-orange font-semibold inline-flex items-center">Voir Le Suivi<ChevronRight className="size-3.5" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : <Empty title="Aucune Commande" text="Vos commandes apparaîtront ici." action={<Link prefetch="intent" to="/recherche" className="btn-primary">Parcourir Les Articles</Link>} />}
    </div>
  );
}
