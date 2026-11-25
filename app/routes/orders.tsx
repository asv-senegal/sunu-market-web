// P13 : Mes Commandes, bascule Mes Achats et Mes Ventes, filtres, suivi
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { apiOrThrow, requireMe } from '~/lib/api.server';
import { fcfa, img, ORDER_STATUS, PAY, dateFr, timeFr } from '~/lib/format';
import { Empty, Seg, TabChips } from '~/components/ui';
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
  ['terminees', 'Terminées', (o) => ['completed', 'declined', 'cancelled'].includes(o.status)], ['signalees', 'Signalées', (o) => o.reported],
];

// Ligne de contexte sous la commande : rendez-vous, avis, signalement
function context(o: any) {
  if (o.reported) return 'Signalement en cours d’examen par l’équipe';
  if (o.status === 'scheduled' && o.meeting_place) return `Rendez-vous ${o.meeting_at ? `le ${dateFr(o.meeting_at)} à ${timeFr(o.meeting_at)}, ` : ''}${o.meeting_place}, paiement ${PAY[o.pay_method]?.toLowerCase()}`;
  if (o.status === 'accepted') return 'Rendez-vous à fixer dans SM-Chat';
  if (o.status === 'completed') return `Reçue le ${dateFr(o.updated_at)}${o.reviewed ? ', avis donné' : ''}`;
  if (o.status === 'new') return `En attente de réponse, paiement prévu : ${PAY[o.pay_method]}`;
  return `${ORDER_STATUS[o.status].label} le ${dateFr(o.updated_at)}`;
}

export default function Orders() {
  const { role, buy, sell, hasShop } = useLoaderData<typeof loader>();
  const [sp] = useSearchParams();
  const f = FILTERS.find(([k]) => k === sp.get('filtre')) || FILTERS[0];
  const items = (role === 'seller' ? sell : buy).filter(f[2]);
  const q = (o: Record<string, string>) => { const n = new URLSearchParams(sp); Object.entries(o).forEach(([k, v]) => n.set(k, v)); return `?${n}`; };
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink animate-fade-up">Mes Commandes</h1>
        <Seg items={[
          { label: `Mes Achats (${buy.length})`, to: q({ vue: 'achats' }), on: role === 'buyer' },
          { label: hasShop ? `Mes Ventes (${sell.length})` : 'Mes Ventes', to: hasShop ? q({ vue: 'ventes' }) : '/ma-boutique', on: role === 'seller' },
        ]} />
      </div>
      <TabChips items={FILTERS.map(([k, l]) => ({ label: l, to: q({ filtre: k }), on: f[0] === k }))} />
      {items.length ? (
        <div className="space-y-3">
          {items.map((o: any, i: number) => {
            const st = o.reported ? { label: 'Signalée', cls: 'bg-red-50 text-red-700' } : ORDER_STATUS[o.status];
            return (
              <div key={o.id} className="card p-4 flex gap-4 items-center" {...stagger(i, 50)}>
                <img src={img(o.photo)} alt="" className="size-16 rounded-[14px] object-cover shrink-0 bg-sable-2" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-[15px] text-ink truncate">{o.title_snapshot}</p><span className={`chip ${st.cls}`}>{st.label}</span></div>
                  <p className="text-[12.5px] text-muted mt-0.5">Commande {o.ref}, {role === 'buyer' ? o.shop_name : o.buyer_name}</p>
                  <p className="text-[13px] text-ink-2 mt-1.5">{context(o)}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                  <p className="font-display font-semibold text-ink">{fcfa(o.total_fcfa)}</p>
                  <Link prefetch="intent" to={`/commandes/${o.id}`} viewTransition className="btn btn-sm bg-indigo-50 text-indigo hover:bg-indigo-100">Voir Le Suivi</Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : <Empty title="Aucune Commande" text={f[0] === 'toutes' ? 'Vos commandes apparaîtront ici.' : 'Aucune commande dans ce filtre.'} action={<Link prefetch="intent" to="/recherche" className="btn-primary">Parcourir Les Articles</Link>} />}
    </>
  );
}
