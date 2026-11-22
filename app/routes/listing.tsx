// Fiche article : Commander ou Écrire Via SM-Chat. Paiement direct au commerçant.
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation, data } from 'react-router';
import { useState } from 'react';
import { BadgeCheck, MapPin, Star, MessageCircle, ShoppingBag, Flag, Info, Megaphone } from 'lucide-react';
import { api, getMe, formError, idemOf, newIdem } from '~/lib/api.server';
import { fcfa, img, CONDITION, PAY, DELIVERY, dateFr } from '~/lib/format';
import { Alert } from '~/components/ui';

export async function loader({ request, params }: any) {
  const [r, me] = await Promise.all([api(request, `/listings/${params.id}`), getMe(request)]);
  if (!r.ok) throw data('Annonce introuvable.', { status: 404 });
  return { l: r.data.listing, me, idem: newIdem() };
}

export const meta = ({ data: d }: any) => [
  { title: d ? `${d.l.title} | Sunu-Market` : 'Annonce | Sunu-Market' },
  { name: 'description', content: d?.l.description?.slice(0, 150) },
  { property: 'og:image', content: d?.l.photos?.[0] },
];

export async function action({ request, params }: any) {
  const f = await request.formData();
  const intent = f.get('intent');
  if (!(await getMe(request))) return redirect(`/connexion?suite=/a/${params.id}`);
  if (intent === 'message') {
    const r = await api(request, '/conversations', { json: { listingId: params.id, body: f.get('body') } });
    if (r.status === 403) return redirect('/verification');
    return r.ok ? redirect(`/messages/${r.data.conversation.id}`) : formError(r);
  }
  if (intent === 'order') {
    const r = await api(request, '/orders', { json: {
      listingId: params.id, quantity: Number(f.get('quantity') || 1), deliveryMode: f.get('deliveryMode'), payMethod: f.get('payMethod'), note: f.get('note') || undefined,
    }, idem: idemOf(f) });
    if (r.status === 403) return redirect('/verification');
    return r.ok ? redirect(`/messages/${r.data.order.conversation_id}?commande=${r.data.order.ref}`) : formError(r);
  }
  if (intent === 'favorite') { await api(request, `/me/favorites/${params.id}`, { method: 'POST' }); return { ok: true }; }
  return null;
}

export default function Listing() {
  const { l, me, idem } = useLoaderData<typeof loader>();
  const err = useActionData<typeof action>() as any;
  const nav = useNavigation();
  const [photo, setPhoto] = useState(0);
  const [mode, setMode] = useState<'message' | null>(null);
  const photos: string[] = l.photos || [];
  const mine = me?.user?.id === l.shop.ownerId;
  const busy = nav.state === 'submitting';
  const rating = l.shop.rating;

  return (
    <div className="container-x py-6">
      <nav className="text-xs text-muted mb-4">
        <Link prefetch="intent" to="/" className="hover:underline">Accueil</Link> / <Link prefetch="intent" to={`/c/${l.category.slug}`} className="hover:underline">{l.category.name}</Link> / <Link prefetch="intent" to={`/c/${l.category.slug}/${l.sub.slug}`} className="hover:underline">{l.sub.name}</Link>
      </nav>
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
        <div>
          <div className="relative aspect-[4/5] md:aspect-[5/4] rounded-3xl overflow-hidden bg-sable-dark">
            <img key={photo} src={img(photos[photo])} alt={l.title} className="size-full object-cover animate-[fade-in_.4s_ease-out]" style={photo === 0 ? { viewTransitionName: `photo-${l.id}` } : undefined} loading="eager" fetchPriority="high" decoding="async" />
            {l.featured && <span className="chip absolute top-3 left-3 bg-indigo text-white"><Megaphone className="size-3" />Mis En Avant</span>}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3">
              {photos.map((p, i) => (
                <button key={p} onClick={() => setPhoto(i)} className={`size-16 rounded-xl overflow-hidden border-2 ${i === photo ? 'border-orange' : 'border-transparent'}`} aria-label={`Photo ${i + 1}`}>
                  <img src={p} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">{l.title}</h1>
            {l.promo_price_fcfa != null ? (
              <p className="mt-2 flex items-baseline gap-3 animate-fade-up"><span className="font-display text-3xl font-bold text-orange">{fcfa(l.promo_price_fcfa)}</span><s className="text-muted">{fcfa(l.price_fcfa)}</s><span className="chip bg-orange text-white">Campagne En Cours</span></p>
            ) : <p className="font-display text-3xl font-bold text-orange mt-2 animate-fade-up">{fcfa(l.price_fcfa)}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="chip bg-indigo-50 text-indigo">{CONDITION[l.condition]}</span>
              <span className="chip bg-sable-dark text-ink">{l.stock > 0 ? `${l.stock} en stock` : 'Épuisé'}</span>
              {l.status !== 'active' && <span className="chip bg-red-50 text-red-700">Annonce {l.status === 'sold' ? 'Vendue' : 'Inactive'}</span>}
            </div>
          </div>

          <Link prefetch="intent" to={`/b/${l.shop.slug}`} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="size-12 rounded-full bg-indigo text-white flex items-center justify-center font-display font-bold">{l.shop.name[0]}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-indigo flex items-center gap-1">{l.shop.name}<BadgeCheck className="size-4 text-turquoise" /></p>
              <p className="text-xs text-muted flex items-center gap-1"><MapPin className="size-3" />{l.shop.quarter || 'Dakar'} · Membre depuis {dateFr(l.shop.since)}</p>
            </div>
            {rating?.count > 0 && <span className="text-sm font-semibold flex items-center gap-1"><Star className="size-4 fill-orange text-orange" />{rating.avg} ({rating.count})</span>}
          </Link>

          {err?.error && <Alert>{err.error}</Alert>}

          {mine ? (
            <Alert tone="info">C’est votre annonce. <Link prefetch="intent" to="/ma-boutique/annonces" className="underline font-semibold">Gérer Mes Annonces</Link></Alert>
          ) : !me ? (
            <div className="grid grid-cols-2 gap-3">
              <Link prefetch="intent" to={`/connexion?suite=/a/${l.id}`} className="btn-primary"><ShoppingBag className="size-4" />Commander</Link>
              <Link prefetch="intent" to={`/connexion?suite=/a/${l.id}`} className="btn-ghost"><MessageCircle className="size-4" />Écrire Via SM-Chat</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {l.stock > 0 && l.status === 'active'
                  ? <Link prefetch="intent" to={`/a/${l.id}/commander`} viewTransition className="btn-primary press"><ShoppingBag className="size-4" />Commander</Link>
                  : <button className="btn-primary" disabled><ShoppingBag className="size-4" />Indisponible</button>}
                <button onClick={() => setMode(mode === 'message' ? null : 'message')} className="btn-ghost press"><MessageCircle className="size-4" />Écrire Via SM-Chat</button>
              </div>
              {mode === 'message' && (
                <Form method="post" className="card p-5 space-y-3 animate-slide-down">
                  <input type="hidden" name="idem" value={idem} />
                  <input type="hidden" name="intent" value="message" />
                  <label className="block"><span className="label">Votre Message</span>
                    <textarea name="body" rows={3} required className="input h-auto py-2" defaultValue="Bonjour, cet article est-il toujours disponible ?" />
                  </label>
                  <button className="btn-indigo w-full" disabled={busy}>Envoyer Dans SM-Chat</button>
                </Form>
              )}
            </>
          )}

          <div className="card p-5">
            <h2 className="font-display font-semibold text-indigo mb-2">Description</h2>
            <p className="text-sm text-ink/85 whitespace-pre-line">{l.description || 'Aucune description.'}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted text-xs">Remise</dt><dd>{l.delivery.map((d: string) => DELIVERY[d]).join(', ')}</dd></div>
              <div><dt className="text-muted text-xs">Paiements Acceptés</dt><dd>{l.pay_methods.map((p: string) => PAY[p]).join(', ')}</dd></div>
              <div><dt className="text-muted text-xs">Publiée Le</dt><dd>{dateFr(l.created_at)}</dd></div>
              <div><dt className="text-muted text-xs">Vues</dt><dd>{l.views}</dd></div>
            </dl>
          </div>
          {me && !mine && (
            <Link prefetch="intent" to={`/signaler?type=listing&id=${l.id}`} className="text-xs text-muted inline-flex items-center gap-1 hover:text-red-700"><Flag className="size-3.5" />Signaler Cette Annonce</Link>
          )}
        </div>
      </div>
    </div>
  );
}
