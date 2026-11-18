// Catégorie « Boutiques » : accès aux boutiques des commerçants
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { api, getMe } from '~/lib/api.server';
import { Empty, PageTitle } from '~/components/ui';

export const meta = () => [{ title: 'Boutiques | Sunu-Market' }];
const VUES: [string, string][] = [['toutes-les-boutiques', 'Toutes Les Boutiques'], ['boutiques-pres-de-chez-moi', 'Près De Chez Moi'], ['nouvelles-boutiques', 'Nouvelles Boutiques'], ['boutiques-a-la-une', 'À La Une']];

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const vue = url.searchParams.get('vue') || 'toutes-les-boutiques';
  const me = await getMe(request);
  const q = new URLSearchParams();
  if (vue === 'nouvelles-boutiques') q.set('sort', 'new');
  if (vue === 'boutiques-a-la-une') q.set('sort', 'featured');
  if (vue === 'boutiques-pres-de-chez-moi' && me?.user?.quarter) q.set('quarter', me.user.quarter);
  const r = await api(request, `/shops?${q}`);
  return { items: r.data.items || [], vue, quarter: me?.user?.quarter };
}

export default function Shops() {
  const { items, vue, quarter } = useLoaderData<typeof loader>();
  return (
    <div className="container-x py-6">
      <PageTitle title="Boutiques" sub="Chaque commerçant vérifié tient sa boutique dans le centre commercial Sunu-Market." />
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {VUES.map(([k, l]) => (
          <Link prefetch="intent" key={k} to={`?vue=${k}`} className={`chip whitespace-nowrap py-1.5 px-3 ${vue === k ? 'bg-indigo text-white' : 'bg-white border border-sable-dark'}`}>{l}</Link>
        ))}
      </div>
      {vue === 'boutiques-pres-de-chez-moi' && !quarter && <p className="text-sm text-muted mb-4">Connectez-vous et indiquez votre quartier dans votre profil pour voir les boutiques proches.</p>}
      {items.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((s: any, i: number) => (
            <Link prefetch="intent" key={s.id} to={`/b/${s.slug}`} viewTransition className="card overflow-hidden lift" data-reveal="" style={{ '--d': `${(i % 6) * 60}ms` } as React.CSSProperties}>
              <div className="h-36 overflow-hidden"><img src={s.banner || '/demo/artisan_stall.jpg'} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" /></div>
              <div className="p-4">
                <p className="font-display font-semibold text-indigo flex items-center gap-1">{s.name}<BadgeCheck className="size-4 text-turquoise" /></p>
                <p className="text-sm text-muted line-clamp-2 mt-1">{s.description}</p>
                <p className="text-xs text-muted mt-3 flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="size-3" />{s.quarter || 'Dakar'}</span>
                  <span>{s.listings} annonces</span>
                  {s.rating?.count > 0 && <span className="flex items-center gap-1"><Star className="size-3 fill-orange text-orange" />{s.rating.avg}</span>}
                  {s.universe && <span>{s.universe}</span>}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : <Empty title="Aucune Boutique Ici Pour Le Moment" action={<Link prefetch="intent" to="/ma-boutique" className="btn-primary">Ouvrir Ma Boutique</Link>} />}
    </div>
  );
}
