// Favoris : annonces enregistrées avec le cœur
import { Link, useFetcher, useLoaderData } from 'react-router';
import { Heart } from 'lucide-react';
import { api, apiOrThrow, requireMe } from '~/lib/api.server';
import { fcfa, img } from '~/lib/format';
import { Empty } from '~/components/ui';
import { stagger } from '~/components/motion';

export const meta = () => [{ title: 'Favoris | Sunu-Market' }];
export async function loader({ request }: any) { await requireMe(request, { verified: false }); return apiOrThrow(request, '/me/favorites'); }
export async function action({ request }: any) {
  const f = await request.formData();
  await api(request, `/me/favorites/${f.get('id')}`, { method: 'POST' });
  return null;
}

export default function Favorites() {
  const { items } = useLoaderData<typeof loader>();
  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink animate-fade-up">Favoris</h1>
          <p className="text-sm text-muted mt-1">{items.length} article{items.length > 1 ? 's' : ''} enregistré{items.length > 1 ? 's' : ''}</p></div>
      </div>
      {items.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
          {items.map((l: any, i: number) => <Fav key={l.id} l={l} i={i} />)}
        </div>
      ) : <Empty title="Aucun Favori" text="Touchez le cœur d’une annonce pour la retrouver ici." action={<Link prefetch="intent" to="/recherche" className="btn-primary">Parcourir Les Articles</Link>} />}
    </>
  );
}

function Fav({ l, i }: { l: any; i: number }) {
  const f = useFetcher();
  if (f.state !== 'idle') return null; // retrait immédiat (optimiste)
  return (
    <div className="group relative" {...stagger(i, 50)}>
      <Link prefetch="intent" to={`/a/${l.id}`} className="block">
        <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-sable-2"><img src={img(l.photo)} alt={l.title} loading="lazy" className="size-full object-cover group-hover:scale-[1.05] transition-transform duration-700" /></div>
        <p className="font-display font-semibold mt-2">{fcfa(l.price_fcfa)}</p>
        <p className="text-sm text-ink/80 line-clamp-1">{l.title}</p>
      </Link>
      <f.Form method="post" className="absolute top-2 right-2">
        <input type="hidden" name="id" value={l.id} />
        <button className="size-9 rounded-full bg-white/95 shadow flex items-center justify-center text-orange hover:scale-110 transition-transform" aria-label="Retirer des favoris"><Heart className="size-[18px] fill-current" /></button>
      </f.Form>
    </div>
  );
}
