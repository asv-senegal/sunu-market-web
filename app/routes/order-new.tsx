// P12 : envoyer une commande. Paiement direct au commerçant, frais Sunu-Market : 0 FCFA.
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation, data } from 'react-router';
import { useState } from 'react';
import { ArrowLeft, MapPin, Truck, Store, Wallet, ShieldCheck, Send, BadgeCheck } from 'lucide-react';
import { api, requireMe, formError } from '~/lib/api.server';
import { fcfa, img, PAY, DELIVERY } from '~/lib/format';
import { Alert } from '~/components/ui';

export const meta = () => [{ title: 'Envoyer Une Commande | Sunu-Market' }];
export async function loader({ request, params }: any) {
  const me = await requireMe(request);
  const r = await api(request, `/listings/${params.id}`);
  if (!r.ok) throw data('Annonce introuvable.', { status: 404 });
  if (r.data.listing.shop.ownerId === me.user.id) throw redirect(`/a/${params.id}`);
  return { l: r.data.listing };
}
export async function action({ request, params }: any) {
  const f = await request.formData();
  const r = await api(request, '/orders', { json: { listingId: params.id, quantity: Number(f.get('quantity') || 1), deliveryMode: f.get('deliveryMode'), payMethod: f.get('payMethod'), note: f.get('note') || undefined } });
  return r.ok ? redirect(`/commandes/${r.data.order.id}`) : formError(r);
}

const DICON: Record<string, any> = { hand: MapPin, delivery: Truck, pickup: Store };
const DSUB: Record<string, string> = { hand: 'Lieu convenu dans SM-Chat', delivery: 'Organisée par le commerçant, tarif à convenir', pickup: 'Dans la boutique du commerçant' };

export default function OrderNew() {
  const { l } = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const [qty, setQty] = useState(1);
  const unit = l.promo_price_fcfa ?? l.price_fcfa;
  const Opt = ({ name, value, checked, icon: Icon, title, sub }: any) => (
    <label className="flex items-center gap-3 rounded-2xl border-2 border-sable-dark bg-white p-3.5 cursor-pointer transition has-[:checked]:border-turquoise has-[:checked]:bg-turquoise-50 hover:border-turquoise/50">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="accent-turquoise" />
      <span className="size-9 rounded-xl bg-sable flex items-center justify-center text-indigo"><Icon className="size-5" /></span>
      <span><span className="font-semibold text-sm block">{title}</span><span className="text-xs text-muted">{sub}</span></span>
    </label>
  );
  return (
    <div className="container-x py-6 max-w-5xl">
      <Link prefetch="intent" to={`/a/${l.id}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-indigo mb-3"><ArrowLeft className="size-4" />Retour À L’Annonce</Link>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-indigo animate-fade-up">Envoyer Une Commande</h1>
      <Form method="post" className="grid lg:grid-cols-[1fr_360px] gap-6 mt-5">
        <div className="space-y-5">
          {a?.error && <Alert>{a.error}</Alert>}
          <div className="card p-4 flex gap-4 items-center animate-fade-up">
            <img src={img(l.photos?.[0])} alt="" className="size-20 rounded-xl object-cover" style={{ viewTransitionName: `photo-${l.id}` }} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{l.title}</p>
              <p className="text-xs text-muted flex items-center gap-1">{l.shop.name}<BadgeCheck className="size-3.5 text-turquoise" /></p>
              <p className="font-display font-bold text-orange mt-1">{fcfa(unit)}</p>
            </div>
            <label className="text-sm"><span className="label">Quantité</span>
              <input name="quantity" type="number" min={1} max={l.stock} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(l.stock, Number(e.target.value) || 1)))} className="input w-20" />
            </label>
          </div>
          <fieldset className="space-y-2" data-reveal="">
            <legend className="font-display font-semibold text-indigo mb-2">Mode De Remise</legend>
            <div className="grid sm:grid-cols-2 gap-2">{l.delivery.map((d: string, i: number) => <Opt key={d} name="deliveryMode" value={d} checked={i === 0} icon={DICON[d]} title={DELIVERY[d]} sub={DSUB[d]} />)}</div>
          </fieldset>
          <fieldset className="space-y-2" data-reveal="">
            <legend className="font-display font-semibold text-indigo mb-2">Moyen De Paiement Souhaité</legend>
            <div className="grid sm:grid-cols-3 gap-2">{l.pay_methods.map((p: string, i: number) => <Opt key={p} name="payMethod" value={p} checked={i === l.pay_methods.length - 1} icon={Wallet} title={PAY[p]} sub={p === 'cash' ? 'À la remise' : 'Au commerçant'} />)}</div>
          </fieldset>
          <label className="block" data-reveal=""><span className="font-display font-semibold text-indigo">Message Au Commerçant (Facultatif)</span>
            <textarea name="note" rows={3} maxLength={500} className="input h-auto py-2 mt-2" placeholder="Bonjour, je peux passer samedi matin." />
          </label>
        </div>
        <aside className="card p-5 h-fit lg:sticky lg:top-36 space-y-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h2 className="font-display font-semibold text-indigo">Récapitulatif</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt>Article ({qty})</dt><dd>{fcfa(unit * qty)}</dd></div>
            <div className="flex justify-between"><dt>Frais Sunu-Market</dt><dd className="text-turquoise font-semibold">0 FCFA</dd></div>
            <div className="flex justify-between border-t border-sable-dark pt-2 font-display font-bold text-lg"><dt>À Régler Au Commerçant</dt><dd className="text-orange">{fcfa(unit * qty)}</dd></div>
          </dl>
          <button className="btn-primary w-full press" disabled={busy}><Send className="size-4" />{busy ? 'Envoi…' : 'Envoyer La Commande'}</button>
          <p className="text-xs text-muted">La commande est envoyée dans SM-Chat. Le commerçant, ou son assistant SM-IA, l’accepte et fixe la remise avec vous.</p>
          <p className="text-xs flex gap-2 rounded-xl bg-turquoise-50 text-turquoise p-3"><ShieldCheck className="size-4 shrink-0" />Conseil sécurité : payez au moment de la remise, après avoir vérifié l’article.</p>
        </aside>
      </Form>
    </div>
  );
}
