// Recherche et catalogue d'une catégorie / sous-catégorie
import { Form, Link, useLoaderData, useRouteLoaderData, useSearchParams, useSubmit, data } from 'react-router';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { api } from '~/lib/api.server';
import { ListingCard, Grid, Empty, AdBanner } from '~/components/ui';
import { X } from 'lucide-react';
import { CONDITION, QUARTERS } from '~/lib/format';
import type { Cat } from '~/components/Shell';
import { Select } from '~/components/Select';

export async function loader({ request, params }: { request: Request; params: { cat?: string; sub?: string } }) {
  const url = new URL(request.url);
  const q = new URLSearchParams(url.search);
  // Les filtres vides (« Tous », prix non saisi) ne sont pas transmis à l'API
  for (const k of [...q.keys()]) if (!q.get(k)) q.delete(k);
  if (params.cat) q.set('category', params.cat);
  if (params.sub) q.set('sub', params.sub);
  const [r, ads] = await Promise.all([api(request, `/listings?${q}`), params.cat ? api(request, `/ads?placement=category&category=${params.cat}`) : Promise.resolve({ data: { items: [] } } as any)]);
  if (!r.ok) throw data(r.data?.error || 'Recherche impossible', { status: r.status });
  return { ...r.data, params, ads: ads.data.items || [] };
}

export const meta = ({ data: d, matches }: any) => {
  const cats: Cat[] = matches.find((m: any) => m.id === 'root')?.data?.cats || [];
  const c = cats.find((x) => x.slug === d?.params?.cat);
  const s = c?.subs.find((x) => x.slug === d?.params?.sub);
  return [{ title: `${s?.name || c?.name || 'Recherche'} | Sunu-Market` }];
};

export default function Catalog() {
  const { items, total, page, pages, params, ads } = useLoaderData<typeof loader>();
  const { cats } = useRouteLoaderData('root') as { cats: Cat[] };
  const [sp] = useSearchParams();
  const submit = useSubmit();
  const [showFilters, setShowFilters] = useState(false);
  const cat = cats.find((c) => c.slug === params.cat);
  const sub = cat?.subs.find((s) => s.slug === params.sub);
  const title = sub?.name || cat?.name || (sp.get('q') ? `Résultats Pour « ${sp.get('q')} »` : 'Tous Les Articles');
  const pageHref = (p: number) => { const n = new URLSearchParams(sp); n.set('page', String(p)); return `?${n}`; };

  return (
    <div className="container-x py-6">
      <nav className="text-xs text-muted mb-2" aria-label="Fil d’Ariane">
        <Link prefetch="intent" to="/" className="hover:underline">Accueil</Link>
        {cat && <> / <Link prefetch="intent" to={`/c/${cat.slug}`} className="hover:underline">{cat.name}</Link></>}
        {sub && <> / <span>{sub.name}</span></>}
      </nav>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-indigo animate-fade-up">{title}</h1>
      <p className="text-sm text-muted mt-1">{total} article{total > 1 ? 's' : ''}</p>

      {cat && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <Link prefetch="intent" to={`/c/${cat.slug}`} className={`chip whitespace-nowrap py-1.5 px-3 ${!sub ? 'bg-indigo text-white' : 'bg-white border border-sable-dark text-ink'}`}>Tout</Link>
          {cat.subs.map((s) => (
            <Link prefetch="intent" key={s.slug} to={`/c/${cat.slug}/${s.slug}`} className={`chip whitespace-nowrap py-1.5 px-3 ${sub?.slug === s.slug ? 'bg-indigo text-white' : 'bg-white border border-sable-dark text-ink'}`}>{s.name}</Link>
          ))}
        </div>
      )}

      <div className="mt-4 md:mt-6 grid md:grid-cols-[230px_1fr] gap-4 md:gap-8">
        <div>
        <button type="button" onClick={() => setShowFilters(!showFilters)} className="md:hidden btn-ghost btn-sm" aria-expanded={showFilters}><SlidersHorizontal className="size-4" />Filtres Et Tri</button>
        {showFilters && <div className="md:hidden fixed inset-0 z-50 bg-indigo/40 animate-[fade-in_.2s_ease-out]" onClick={() => setShowFilters(false)} aria-hidden="true" />}
        <Form method="get" onChange={(e) => submit(e.currentTarget, { preventScrollReset: true })}
          className={`space-y-5 md:mt-0 ${showFilters ? 'fixed md:static inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-y-auto sheet-in md:bg-transparent md:p-0 md:rounded-none md:max-h-none' : 'hidden'} md:block`}>
          <div className="md:hidden flex items-center justify-between"><p className="font-display font-semibold text-indigo">Filtres Et Tri</p><button type="button" onClick={() => setShowFilters(false)} aria-label="Fermer" className="p-2"><X className="size-5" /></button></div>
          <p className="hidden md:flex font-semibold text-indigo items-center gap-2"><SlidersHorizontal className="size-4" />Filtres</p>
          {sp.get('q') && <input type="hidden" name="q" value={sp.get('q')!} />}
          {!cat && (
            <label className="block"><span className="label">Catégorie</span>
              <Select name="category" defaultValue={sp.get('category') || ''} autoSubmit options={[{ value: '', label: 'Toutes' }, ...cats.filter((c) => !c.is_shops).map((c) => ({ value: c.slug, label: c.name }))]} />
            </label>
          )}
          <label className="block"><span className="label">Trier Par</span>
            <Select name="sort" defaultValue={sp.get('sort') || 'relevance'} autoSubmit options={[{ value: 'relevance', label: 'Pertinence' }, { value: 'recent', label: 'Plus Récents' }, { value: 'price_asc', label: 'Prix Croissant' }, { value: 'price_desc', label: 'Prix Décroissant' }]} />
          </label>
          <div><span className="label">Prix (FCFA)</span>
            <div className="flex gap-2">
              <input name="min" type="number" min={0} inputMode="numeric" placeholder="Min" defaultValue={sp.get('min') || ''} className="input" aria-label="Prix minimum" />
              <input name="max" type="number" min={0} inputMode="numeric" placeholder="Max" defaultValue={sp.get('max') || ''} className="input" aria-label="Prix maximum" />
            </div>
          </div>
          <label className="block"><span className="label">État</span>
            <Select name="condition" defaultValue={sp.get('condition') || ''} autoSubmit options={[{ value: '', label: 'Tous' }, ...Object.entries(CONDITION).map(([k, v]) => ({ value: k, label: v }))]} />
          </label>
          <label className="block"><span className="label">Quartier</span>
            <Select name="quarter" defaultValue={sp.get('quarter') || ''} autoSubmit options={[{ value: '', label: 'Tout Dakar' }, ...QUARTERS.map((q) => ({ value: q, label: q }))]} />
          </label>
          <noscript><button className="btn-indigo w-full">Appliquer</button></noscript>
          <button type="button" onClick={() => setShowFilters(false)} className="md:hidden btn-primary w-full">Voir Les {total} Articles</button>
        </Form>
        </div>
        <div>
          {ads.length > 0 && <div className="mb-6"><AdBanner ads={ads} /></div>}
          {items.length ? <Grid>{items.map((l: any, i: number) => <ListingCard key={l.id} l={l} i={i} />)}</Grid>
            : <Empty title="Aucun Article Pour Le Moment" text="Modifiez vos filtres ou revenez bientôt : de nouvelles annonces arrivent chaque jour." action={<Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className="btn-primary">Poser Une Annonce</Link>} />}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && <Link prefetch="intent" to={pageHref(page - 1)} className="btn-ghost btn-sm">Précédent</Link>}
              <span className="text-sm text-muted self-center">Page {page} sur {pages}</span>
              {page < pages && <Link prefetch="intent" to={pageHref(page + 1)} className="btn-ghost btn-sm">Suivant</Link>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
