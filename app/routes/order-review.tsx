// P16 : donner un avis après la remise
import { Form, redirect, useActionData, useLoaderData, useNavigation, Link } from 'react-router';
import { useState } from 'react';
import { Star, ArrowLeft } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { img } from '~/lib/format';
import { Alert } from '~/components/ui';

export const meta = () => [{ title: 'Donner Un Avis | Sunu-Market' }];
export const loader = ({ request, params }: any) => apiOrThrow(request, `/orders/${params.id}`);
export async function action({ request, params }: any) {
  const f = await request.formData();
  const r = await api(request, `/orders/${params.id}/review`, { json: { rating: Number(f.get('rating')), tags: f.getAll('tags'), comment: f.get('comment') || undefined } });
  return r.ok ? redirect(`/commandes/${params.id}`) : formError(r);
}
const TAGS = { buyer: ['Ponctuel', 'Article Conforme', 'Aimable', 'Bonne Communication', 'Bien Emballé'], seller: ['Ponctuel', 'Paiement Rapide', 'Aimable', 'Bonne Communication'] };
const LABEL = ['', 'Décevant', 'Moyen', 'Correct', 'Très Bien', 'Excellent'];

export default function Review() {
  const { order: o, role } = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  return (
    <div className="container-x py-6 max-w-2xl">
      <Link prefetch="intent" to={`/commandes/${o.id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-indigo mb-3"><ArrowLeft className="size-4" />Commande {o.ref}</Link>
      <Form method="post" className="card p-6 md:p-10 space-y-6 text-center animate-fade-up">
        <img src={img(o.photo)} alt="" className="size-20 rounded-2xl object-cover mx-auto" loading="lazy" decoding="async" />
        <div><h1 className="font-display text-2xl font-bold text-indigo">Comment S’est Passée La Remise ?</h1><p className="text-sm text-muted mt-1">{role === 'buyer' ? o.shop_name : o.buyer_name} · {o.title_snapshot}</p></div>
        {a?.error && <Alert>{a.error}</Alert>}
        <input type="hidden" name="rating" value={rating} />
        <div className="flex justify-center gap-2" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Note">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} role="radio" aria-checked={rating === n} aria-label={`${n} sur 5`} className="transition-transform hover:scale-125 press">
              <Star className={`size-10 transition-colors ${n <= shown ? 'fill-[#E8A317] text-[#E8A317]' : 'text-sable-dark'}`} />
            </button>
          ))}
        </div>
        <p key={shown} className="font-display font-semibold text-orange animate-pop">{LABEL[shown]}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TAGS[role as 'buyer' | 'seller'].map((t) => (
            <label key={t} className="chip border border-sable-dark bg-white py-2 px-3 cursor-pointer transition has-[:checked]:bg-turquoise has-[:checked]:text-white has-[:checked]:border-turquoise">
              <input type="checkbox" name="tags" value={t} className="sr-only" />{t}
            </label>
          ))}
        </div>
        <textarea name="comment" rows={3} maxLength={600} className="input h-auto py-2 text-left" placeholder="Votre commentaire (facultatif)" />
        <button className="btn-primary w-full press" disabled={busy}>Publier Mon Avis</button>
      </Form>
    </div>
  );
}
