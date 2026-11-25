// Avis Clients : notes reçues par la boutique, répartition, points forts, acheteurs à noter en retour
import { Link, useLoaderData } from 'react-router';
import { Star, MessageSquareQuote } from 'lucide-react';
import { apiOrThrow } from '~/lib/api.server';
import { dateFr } from '~/lib/format';
import { Empty } from '~/components/ui';
import { stagger } from '~/components/motion';

export const meta = () => [{ title: 'Avis Clients | Sunu-Market' }];
export const handle = { title: 'Avis Clients' };
export const loader = ({ request }: any) => apiOrThrow(request, '/me/reviews');

const Stars = ({ n, size = 'size-4' }: { n: number; size?: string }) => (
  <span className="flex gap-0.5" aria-label={`${n} sur 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= Math.round(n) ? 'fill-[#E8A317] text-[#E8A317]' : 'fill-sable-2 text-sable-2'}`} />)}</span>
);

export default function Reviews() {
  const d = useLoaderData<typeof loader>();
  const total = d.items.length;
  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="card p-6 text-center" data-reveal="">
          <p className="font-display text-5xl font-semibold text-ink">{d.average != null ? d.average.toLocaleString('fr-FR') : '–'}</p>
          <div className="flex justify-center mt-2"><Stars n={d.average || 0} size="size-5" /></div>
          <p className="text-sm text-muted mt-2">{total} avis vérifié{total > 1 ? 's' : ''}, après une commande terminée</p>
          <ul className="mt-5 space-y-1.5 text-left">
            {d.distribution.map((x: any) => (
              <li key={x.stars} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-muted">{x.stars} ★</span>
                <span className="flex-1 h-2 rounded-full bg-sable-2 overflow-hidden"><span className="block h-full bg-[#E8A317] rounded-full bar-x" style={{ width: `${total ? (x.count / total) * 100 : 0}%` }} /></span>
                <span className="w-6 text-right text-muted">{x.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="card p-5" data-reveal="">
            <h2 className="font-display font-semibold text-ink">Ce Que Vos Clients Apprécient</h2>
            {d.tags.length ? (
              <div className="flex flex-wrap gap-2 mt-3">{d.tags.map((t: any) => <span key={t.tag} className="tabchip">{t.tag}<b className="text-indigo">{t.count}</b></span>)}</div>
            ) : <p className="text-sm text-muted mt-2">Les points forts cités par vos acheteurs apparaîtront ici.</p>}
          </div>
          <div className="card p-5" data-reveal="">
            <h2 className="font-display font-semibold text-ink">Acheteurs À Noter</h2>
            <p className="text-xs text-muted mt-0.5">La notation est réciproque : les deux avis sont publiés en même temps.</p>
            {d.toReview.length ? (
              <ul className="divide-y divide-line mt-2">
                {d.toReview.map((o: any) => (
                  <li key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="flex-1 min-w-0"><b>{o.first_name} {o.last_name[0]}.</b> <span className="text-muted">· {o.ref}, {o.title_snapshot}</span></span>
                    <Link prefetch="intent" to={`/commandes/${o.id}/avis`} className="btn btn-sm bg-indigo-50 text-indigo hover:bg-indigo-100"><Star className="size-3.5" />Noter</Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted mt-2">Aucun acheteur en attente de note.</p>}
          </div>
        </div>
      </div>
      {total ? (
        <ul className="grid md:grid-cols-2 gap-3">
          {d.items.map((r: any, i: number) => (
            <li key={r.id} className="card p-5" {...stagger(i, 40)}>
              <div className="flex items-center gap-3">
                <span className="size-10 rounded-full bg-indigo text-white text-sm font-semibold flex items-center justify-center">{r.first_name[0]}{r.last_name[0]}</span>
                <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{r.first_name} {r.last_name[0]}.</p><p className="text-[11.5px] text-muted truncate">{r.ref}, {r.title_snapshot} · {dateFr(r.created_at)}</p></div>
                <Stars n={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-ink-2 mt-3 flex gap-2"><MessageSquareQuote className="size-4 text-muted shrink-0 mt-0.5" />{r.comment}</p>}
              {r.tags?.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{r.tags.map((t: string) => <span key={t} className="chip bg-turquoise-50 text-turquoise">{t}</span>)}</div>}
            </li>
          ))}
        </ul>
      ) : <Empty title="Pas Encore D’Avis" text="Après chaque remise, l’acheteur est invité à noter votre boutique. Les avis apparaissent sur votre vitrine." />}
    </div>
  );
}
