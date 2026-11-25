// P25 : campagnes, mise en avant et publicité (services payants de la plateforme)
import { Form, redirect, useActionData, useLoaderData, useNavigation, useSearchParams, useRouteLoaderData } from 'react-router';
import { useState } from 'react';
import { Megaphone, Rocket, TrendingUp, Check, ImagePlus, Eye, MousePointerClick } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { fcfa, img, PAY, dateFr, QUARTERS } from '~/lib/format';
import { Alert, Field } from '~/components/ui';
import type { Cat } from '~/components/Shell';
import { Select } from '~/components/Select';

export const handle = { title: 'Campagnes Et Mise En Avant' };
export const meta = () => [{ title: 'Campagnes Et Mise En Avant | Sunu-Market' }];
export async function loader({ request }: any) {
  const [p, l] = await Promise.all([apiOrThrow(request, '/me/promotions'), apiOrThrow(request, '/me/shop/listings')]);
  return { ...p, listings: l.items.filter((x: any) => x.status === 'active') };
}
export async function action({ request }: any) {
  const form = await request.formData();
  const clean = new FormData();
  for (const [k, v] of form.entries()) if (!(typeof v === 'object' && (v as File).size === 0) && v !== '') clean.append(k, v);
  const r = await api(request, '/me/promotions', { form: clean });
  if (!r.ok) return formError(r);
  if (r.data.payment.checkout_url) return redirect(r.data.payment.checkout_url);
  return redirect(`/paiement/${r.data.payment.ref}`);
}

const OFFERS = [
  { k: 'featured', icon: Megaphone, title: 'Mettre Un Produit En Avant', sub: 'Placement payant dans les emplacements privilégiés', items: ['En tête des résultats', 'Page d’accueil', 'Autres espaces stratégiques'], tone: 'bg-orange text-white' },
  { k: 'campaign', icon: Rocket, title: 'Lancer Une Campagne', sub: 'Promotion d’un produit sur une période', items: ['Prix promotionnel affiché', 'Boutique À La Une', 'Durée 3 à 14 jours'], tone: 'bg-indigo text-white' },
  { k: 'ad', icon: TrendingUp, title: 'Publicité', sub: 'Bannière pour les commerçants et entreprises', items: ['Bannière accueil ou catégorie', 'Ciblage par quartier', 'Statistiques de vues'], tone: 'bg-turquoise text-white' },
] as const;
const KL: Record<string, string> = { featured: 'Mise En Avant', campaign: 'Campagne', ad: 'Publicité' };
const PST: Record<string, string> = { pending_payment: 'Paiement En Attente', active: 'Active', ended: 'Terminée', cancelled: 'Annulée' };

export default function Visibility() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const { cats } = useRouteLoaderData('root') as { cats: Cat[] };
  const [sp] = useSearchParams();
  const busy = useNavigation().state === 'submitting';
  const [kind, setKind] = useState<string>(sp.get('type') || 'featured');
  const [listingId, setListingId] = useState(sp.get('annonce') || d.listings[0]?.id || '');
  const [days, setDays] = useState(Number(sp.get('jours')) || 7);
  const [promo, setPromo] = useState<number | ''>('');
  const [method, setMethod] = useState<'wave' | 'orange_money'>('wave');
  const [banner, setBanner] = useState<string | null>(null);
  const perDay = d.prices[kind];
  const total = perDay != null ? Number(perDay) * days : null;
  const l = d.listings.find((x: any) => x.id === listingId);
  const live = d.live[method];
  return (
    <>
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      <Form method="post" encType="multipart/form-data" className="grid xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <section>
            <h2 className="font-display font-semibold text-ink mb-3">1- Choisissez Le Service</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {OFFERS.map((o, i) => (
                <label key={o.k} className={`card p-4 cursor-pointer transition-all duration-300 border-2 ${kind === o.k ? 'border-orange shadow-lg -translate-y-1' : 'border-transparent hover:-translate-y-0.5'}`} data-reveal="" style={{ '--d': `${i * 80}ms` } as React.CSSProperties}>
                  <input type="radio" name="kind" value={o.k} checked={kind === o.k} onChange={() => setKind(o.k)} className="sr-only" />
                  <span className={`size-10 rounded-xl flex items-center justify-center ${o.tone}`}><o.icon className="size-5" /></span>
                  <p className="font-semibold mt-3">{o.title}</p><p className="text-xs text-muted">{o.sub}</p>
                  <ul className="mt-3 space-y-1">{o.items.map((x) => <li key={x} className="text-xs flex gap-1.5"><Check className="size-3.5 text-turquoise" />{x}</li>)}</ul>
                  <p className="text-xs font-semibold mt-3 text-orange-dark">{d.prices[o.k] != null ? `${fcfa(d.prices[o.k])} par jour` : 'Tarif à confirmer'}</p>
                </label>
              ))}
            </div>
          </section>
          <section className="card p-5 space-y-4 animate-fade-up" key={kind}>
            <h2 className="font-display font-semibold text-ink">2- {kind === 'ad' ? 'Bannière Et Ciblage' : 'Produit Et Emplacement'}</h2>
            {kind !== 'ad' ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Produit"><Select name="listingId" value={listingId} onChange={setListingId} aria-label="Produit" options={d.listings.map((x: any) => ({ value: x.id, label: x.title, hint: fcfa(x.price_fcfa) }))} /></Field>
                {kind === 'featured' ? (
                  <Field label="Emplacement"><Select name="placement" defaultValue="search_top" aria-label="Emplacement" options={[{ value: 'search_top', label: 'Tête Des Résultats' }, { value: 'home', label: 'Page D’Accueil' }, { value: 'category', label: 'Page De Catégorie' }]} /></Field>
                ) : (
                  <Field label="Prix Promotionnel (FCFA)" name="promoPrice" type="number" min={0} value={promo} onChange={(e: any) => setPromo(e.target.value ? Number(e.target.value) : '')} required hint={l ? `Prix actuel : ${fcfa(l.price_fcfa)}` : undefined} />
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Titre De La Bannière" name="title" maxLength={80} required placeholder="Ex. Moussa Tech : téléphones testés" />
                <Field label="Emplacement"><Select name="placement" defaultValue="home" aria-label="Emplacement" options={[{ value: 'home', label: 'Accueil' }, { value: 'category', label: 'Catégorie' }]} /></Field>
                <Field label="Catégorie Ciblée"><Select name="categoryId" defaultValue="" aria-label="Catégorie ciblée" options={[{ value: '', label: 'Toutes' }, ...cats.filter((c) => !c.is_shops).map((c) => ({ value: String(c.id), label: c.name }))]} /></Field>
                <Field label="Quartier Ciblé"><Select name="quarter" defaultValue="" aria-label="Quartier ciblé" options={[{ value: '', label: 'Tout Dakar' }, ...QUARTERS.map((q) => ({ value: q, label: q }))]} /></Field>
                <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl border-2 border-dashed border-sable-dark p-4 cursor-pointer hover:border-turquoise">
                  {banner ? <img src={banner} alt="" className="h-14 w-28 rounded-lg object-cover" /> : <ImagePlus className="size-7 text-indigo" />}
                  <span className="text-sm"><b className="text-indigo block">Image De La Bannière</b><span className="text-xs text-muted">Format large, 1600 × 400 conseillé</span></span>
                  <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; setBanner(f ? URL.createObjectURL(f) : null); }} />
                </label>
              </div>
            )}
            <Field label="Durée">
              <Select name="days" value={String(days)} onChange={(v: string) => setDays(Number(v))} aria-label="Durée"
                options={(kind === 'campaign' ? [3, 5, 7, 10, 14] : [1, 3, 5, 7, 14, 21, 30]).map((n) => ({ value: String(n), label: `${n} jour${n > 1 ? 's' : ''}` }))} />
            </Field>
          </section>
          <section className="card p-5 space-y-3">
            <h2 className="font-display font-semibold text-ink">3- Paiement À Sunu-Market</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['wave', 'orange_money'] as const).map((p) => (
                <label key={p} className="rounded-2xl border-2 border-sable-dark p-3 cursor-pointer has-[:checked]:border-turquoise has-[:checked]:bg-turquoise-50 transition">
                  <input type="radio" name="payMethod" value={p} checked={method === p} onChange={() => setMethod(p)} className="accent-turquoise" /><span className="font-semibold ml-2">{PAY[p]}</span>
                </label>
              ))}
            </div>
            {!live && <Field label="Référence De Transaction" name="payRef" required minLength={4} placeholder="Après l’envoi au numéro marchand [à confirmer]" />}
          </section>
        </div>
        <aside className="space-y-4 xl:sticky xl:top-36 h-fit">
          <div className="card p-5 animate-fade-up">
            <p className="text-sm font-semibold text-indigo mb-3">Aperçu Pour Les Acheteurs</p>
            {kind === 'ad' ? (
              <div className="relative h-24 rounded-xl overflow-hidden bg-indigo">{banner && <img src={banner} alt="" className="size-full object-cover opacity-70" />}<span className="absolute top-2 left-2 chip bg-white/20 text-white text-[10px]">Publicité</span></div>
            ) : l && (
              <div className="w-40 mx-auto">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden"><img src={img(l.photo)} alt="" className="size-full object-cover" />
                  <span className="chip absolute top-2 left-2 bg-indigo text-white animate-pop"><Megaphone className="size-3" />Mis En Avant</span></div>
                <p className="font-display font-semibold mt-2">{kind === 'campaign' && promo !== '' ? <><span className="text-orange">{fcfa(Number(promo))}</span> <s className="text-xs text-muted">{fcfa(l.price_fcfa)}</s></> : fcfa(l.price_fcfa)}</p>
                <p className="text-xs text-muted line-clamp-1">{l.title}</p>
              </div>
            )}
          </div>
          <div className="card p-5 space-y-3">
            <div className="flex justify-between text-sm"><span>{KL[kind]}, {days} jours</span><b>{total != null ? fcfa(total) : '[à confirmer]'}</b></div>
            <button className="btn-primary w-full press" disabled={busy || total == null || (kind !== 'ad' && !l)}><Megaphone className="size-4" />{total == null ? 'Tarif À Fixer Par Sunu-Market' : live ? `Payer ${fcfa(total)}` : 'Déclarer Le Paiement Et Lancer'}</button>
            <p className="text-xs text-muted">Le service démarre dès la confirmation du paiement.</p>
          </div>
        </aside>
      </Form>
      {d.items.length > 0 && (
        <>
          <h2 className="font-display font-semibold text-ink mt-8 mb-3">Mes Campagnes</h2>
          <div className="card divide-y divide-sable-dark" data-reveal="">
            {d.items.map((p: any) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold w-32">{KL[p.kind]}</span>
                <span className="flex-1 min-w-[160px]">{p.listing_title || p.title}{p.ends_at && <span className="text-xs text-muted block">jusqu’au {dateFr(p.ends_at)}</span>}</span>
                {p.kind === 'ad' && <span className="text-xs text-muted flex items-center gap-3"><span className="flex items-center gap-1"><Eye className="size-3.5" />{p.impressions}</span><span className="flex items-center gap-1"><MousePointerClick className="size-3.5" />{p.clicks}</span></span>}
                <span className="chip bg-sable-dark">{PST[p.status]}</span>
                {p.total_fcfa && <b>{fcfa(p.total_fcfa)}</b>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
