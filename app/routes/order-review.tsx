// P16 : donner un avis après la remise
import { Form, redirect, useActionData, useLoaderData, useNavigation, Link } from 'react-router';
import { useState } from 'react';
import { Star, Users } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { Alert } from '~/components/ui';

export const meta = () => [{ title: 'Donner Un Avis | Sunu-Market' }];
export const loader = ({ request, params }: any) => apiOrThrow(request, `/orders/${params.id}`);
export async function action({ request, params }: any) {
  const f = await request.formData();
  const r = await api(request, `/orders/${params.id}/review`, { json: { rating: Number(f.get('rating')), tags: f.getAll('tags'), comment: f.get('comment') || undefined } });
  return r.ok ? redirect(`/commandes/${params.id}`) : formError(r);
}
const TAGS = { buyer: ['Article Conforme', 'Ponctuel', 'Très Aimable', 'Bon Emballage', 'Bonne Communication', 'Prix Juste'], seller: ['Ponctuel', 'Paiement Rapide', 'Aimable', 'Bonne Communication'] };
const LABEL = ['', 'Décevant', 'Moyen', 'Correct', 'Très Bien', 'Excellent'];

export default function Review() {
  const { order: o, role } = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  const other = role === 'buyer' ? o.shop_name : o.buyer_name;
  return (
    <Form method="post" className="card p-6 md:p-8 space-y-5 text-center max-w-[480px] w-full animate-fade-up">
      <span className="size-14 rounded-full bg-indigo text-white font-display font-semibold text-lg flex items-center justify-center mx-auto">{String(other).split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}</span>
      <div><h1 className="font-display text-xl md:text-[22px] font-semibold text-ink">{role === 'buyer' ? 'Comment S’est Passé Votre Achat ?' : 'Comment S’est Passée La Remise ?'}</h1>
        <p className="text-[13px] text-muted mt-1">{other}, {o.title_snapshot}</p></div>
      {a?.error && <Alert>{a.error}</Alert>}
      <input type="hidden" name="rating" value={rating} />
      <div className="flex justify-center gap-2" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} role="radio" aria-checked={rating === n} aria-label={`${n} sur 5`} className="transition-transform hover:scale-125 press">
            <Star className={`size-9 transition-colors ${n <= shown ? 'fill-[#E8A317] text-[#E8A317]' : 'fill-sable-2 text-sable-2'}`} />
          </button>
        ))}
      </div>
      <p key={shown} className="font-display font-semibold text-orange text-sm animate-pop">{LABEL[shown]}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {TAGS[role as 'buyer' | 'seller'].map((t) => (
          <label key={t} className="tabchip cursor-pointer has-[:checked]:bg-indigo has-[:checked]:text-white has-[:checked]:border-indigo">
            <input type="checkbox" name="tags" value={t} className="sr-only" />{t}
          </label>
        ))}
      </div>
      <label className="block text-left"><span className="label">Commentaire (facultatif)</span>
        <textarea name="comment" rows={3} maxLength={600} className="input h-auto py-2.5" placeholder="Ce qui vous a plu, ce qui pourrait être amélioré…" /></label>
      <div className="rounded-xl bg-indigo-50 text-indigo text-[12.5px] p-3 text-left flex gap-2"><Users className="size-4 shrink-0 mt-0.5" />La notation est réciproque : {role === 'buyer' ? 'le commerçant vous note aussi' : 'l’acheteur vous note aussi'}. Les deux avis sont publiés en même temps.</div>
      <div className="flex gap-2">
        <button className="btn-primary press" disabled={busy}>Publier Mon Avis</button>
        <Link prefetch="intent" to={`/commandes/${o.id}`} className="btn-ghost">Plus Tard</Link>
      </div>
    </Form>
  );
}
