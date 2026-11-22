import { Link, useLoaderData, data } from 'react-router';
import { BadgeCheck, MapPin, Star, ShoppingBag, Calendar } from 'lucide-react';
import { api } from '~/lib/api.server';
import { ListingCard, Grid, Empty } from '~/components/ui';
import { dateFr } from '~/lib/format';

export async function loader({ request, params }: any) {
  const [s, l] = await Promise.all([api(request, `/shops/${params.slug}`), api(request, `/listings?shop=${encodeURIComponent(params.slug)}&sort=recent`)]);
  if (!s.ok) throw data('Boutique introuvable.', { status: 404 });
  return { ...s.data, listings: l.data.items || [] };
}
export const meta = ({ data: d }: any) => [{ title: `${d?.shop?.name || 'Boutique'} | Sunu-Market` }];

export default function Shop() {
  const { shop, reviews, listings } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="h-40 md:h-56 bg-indigo relative overflow-hidden">
        {shop.banner && <img src={shop.banner} alt="" className="size-full object-cover opacity-70 kenburns" loading="eager" fetchPriority="high" decoding="async" />}
      </div>
      <div className="container-x -mt-12 relative">
        <div className="card p-5 md:p-6 flex flex-wrap items-center gap-4 animate-fade-up">
          <span className="size-20 rounded-2xl bg-orange text-white flex items-center justify-center font-display text-3xl font-bold border-4 border-white">{shop.name[0]}</span>
          <div className="flex-1 min-w-[200px]">
            <h1 className="font-display text-2xl font-bold text-indigo flex items-center gap-2">{shop.name}{shop.owner_verified && <BadgeCheck className="size-5 text-turquoise" />}</h1>
            <p className="text-sm text-muted mt-1">{shop.description}</p>
          </div>
          <dl className="flex gap-6 text-sm">
            <Stat icon={Star} label="Note" value={shop.rating?.count ? `${shop.rating.avg} / 5 (${shop.rating.count})` : 'Nouveau'} />
            <Stat icon={ShoppingBag} label="Ventes" value={shop.sales} />
            <Stat icon={MapPin} label="Quartier" value={shop.quarter || 'Dakar'} />
            <Stat icon={Calendar} label="Depuis" value={dateFr(shop.created_at)} />
          </dl>
        </div>
        <h2 className="font-display text-xl font-bold text-indigo mt-10 mb-4">Annonces ({listings.length})</h2>
        {listings.length ? <Grid>{listings.map((l: any, i: number) => <ListingCard key={l.id} l={l} i={i} />)}</Grid> : <Empty title="Aucune Annonce Pour Le Moment" />}
        {reviews.length > 0 && (
          <>
            <h2 className="font-display text-xl font-bold text-indigo mt-10 mb-4">Avis Des Acheteurs</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((r: any, i: number) => (
                <div key={i} className="card p-4">
                  <p className="flex gap-0.5 text-orange">{Array.from({ length: r.rating }).map((_, k) => <Star key={k} className="size-4 fill-current" />)}</p>
                  {r.comment && <p className="text-sm mt-2">{r.comment}</p>}
                  <p className="text-xs text-muted mt-2">{r.author} · {dateFr(r.created_at)}{r.tags?.length ? ` · ${r.tags.join(', ')}` : ''}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function Stat({ icon: Icon, label, value }: any) {
  return <div><dt className="text-xs text-muted flex items-center gap-1"><Icon className="size-3" />{label}</dt><dd className="font-semibold text-ink">{value}</dd></div>;
}
