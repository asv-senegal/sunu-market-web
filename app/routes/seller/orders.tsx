// Commandes reçues : colonnes Nouvelles, Acceptées, Remise Prévue, Terminées
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { LayoutGrid, List, Download } from 'lucide-react';
import { fcfa, ORDER_STATUS, PAY, dateFr } from '~/lib/format';
import { apiOrThrow } from '~/lib/api.server';
import { orderAction } from '~/lib/orders.server';
import { OrderCard } from '~/components/OrderCard';
import { PageTitle } from '~/components/ui';

export const meta = () => [{ title: 'Commandes Reçues | Sunu-Market' }];
export const loader = ({ request }: any) => apiOrThrow(request, '/orders?role=seller');
export const action = ({ request }: any) => orderAction(request);
const COLS: [string, string[]][] = [['Nouvelles', ['new']], ['Acceptées', ['accepted']], ['Remise Prévue', ['scheduled']], ['Terminées', ['completed', 'declined', 'cancelled']]];

export default function SellerOrders() {
  const { items } = useLoaderData<typeof loader>();
  const [sp] = useSearchParams();
  const list = sp.get('vue') === 'liste';
  return (
    <>
      <PageTitle title="Commandes Reçues" sub="Le paiement se fait directement entre vous et l’acheteur, à la remise.">
        <div className="flex gap-2">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-white border border-sable-dark text-xs font-semibold">
            <Link prefetch="intent" to="?vue=tableau" className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${!list ? 'bg-indigo text-white' : 'text-muted'}`}><LayoutGrid className="size-3.5" />Tableau</Link>
            <Link prefetch="intent" to="?vue=liste" className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${list ? 'bg-indigo text-white' : 'text-muted'}`}><List className="size-3.5" />Liste</Link>
          </div>
          <a href="/exports/commandes.csv" className="btn-ghost btn-sm"><Download className="size-3.5" />Exporter</a>
        </div>
      </PageTitle>
      {list ? (
        <div className="card overflow-x-auto animate-fade-up">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className="p-3">Commande</th><th className="p-3">Article</th><th className="p-3">Acheteur</th><th className="p-3">Paiement</th><th className="p-3">Total</th><th className="p-3">État</th></tr></thead>
            <tbody className="divide-y divide-sable-dark">
              {items.map((o: any) => (
                <tr key={o.id} className="hover:bg-sable/60"><td className="p-3"><Link prefetch="intent" to={`/commandes/${o.id}`} className="font-semibold text-indigo hover:underline">{o.ref}</Link><p className="text-xs text-muted">{dateFr(o.created_at)}</p></td>
                  <td className="p-3">{o.quantity} × {o.title_snapshot}</td><td className="p-3">{o.buyer_name}</td><td className="p-3">{PAY[o.pay_method]}</td>
                  <td className="p-3 font-semibold whitespace-nowrap">{fcfa(o.total_fcfa)}</td><td className="p-3"><span className={`chip ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
      <div className="grid lg:grid-cols-2 gap-x-6 gap-y-8">
        {COLS.map(([title, sts]) => {
          const list = items.filter((o: any) => sts.includes(o.status));
          return (
            <section key={title} className="min-w-0" data-reveal="">
              <h2 className="font-display font-semibold text-indigo mb-2 flex items-center gap-2">{title}<span className="chip bg-sable-dark text-muted">{list.length}</span></h2>
              <div className="space-y-3">{list.length ? list.map((o: any) => <OrderCard key={o.id} o={o} role="seller" />) : <p className="text-xs text-muted card p-4">Aucune commande.</p>}</div>
            </section>
          );
        })}
      </div>
      )}
    </>
  );
}
