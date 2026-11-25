// P28 : recharger les crédits SM-IA (montant + commission, paiement Wave ou Orange Money)
import { Form, redirect, useActionData, useLoaderData, useNavigation, Link } from 'react-router';
import { useMemo, useState } from 'react';
import { Coins, Lock, Sparkles } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { fcfa, PAY, dateFr } from '~/lib/format';
import { Alert, Field } from '~/components/ui';
import { stagger } from '~/components/motion';

export const handle = { title: 'Recharger Mes Crédits SM-IA' };
export const meta = () => [{ title: 'Recharger Mes Crédits SM-IA | Sunu-Market' }];
export const loader = ({ request }: any) => apiOrThrow(request, '/me/smia');
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/me/smia/recharge', { json: { amount: Number(f.get('amount')), payMethod: f.get('payMethod'), payRef: f.get('payRef') || undefined } });
  if (!r.ok) return formError(r);
  if (r.data.payment.checkout_url) return redirect(r.data.payment.checkout_url);
  return redirect(`/paiement/${r.data.payment.ref}`);
}
const KIND: Record<string, string> = { grant_trial: 'Crédits inclus dans l’essai', grant_subscription: 'Crédits inclus dans l’abonnement', recharge: 'Recharge', usage: 'Consommation SM-IA', adjust: 'Ajustement' };

export default function Recharge() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const p = d.pricing;
  const [amount, setAmount] = useState<number>(p.packs[Math.min(2, p.packs.length - 1)]?.amount || 2000);
  const [method, setMethod] = useState<'wave' | 'orange_money'>('wave');
  const q = useMemo(() => ({ credits: Math.floor((amount * p.creditsPer1000) / 1000), commission: Math.round((amount * p.commissionPct) / 100) }), [amount, p]);
  const live = d.live[method];
  return (
    <>
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      <Form method="post" className="grid xl:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="font-display font-semibold text-ink mb-3">1- Montant De La Recharge</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {p.packs.map((k: any, i: number) => (
                <button type="button" key={k.amount} onClick={() => setAmount(k.amount)} className={`rounded-2xl border-2 p-4 text-left transition-all duration-300 press ${amount === k.amount ? 'border-orange bg-orange-50 -translate-y-1 shadow-md' : 'border-sable-dark hover:border-orange/50'}`} {...stagger(i)}>
                  <p className="text-xs text-muted">Recharge</p><p className="font-display text-xl font-bold text-indigo">{fcfa(k.amount)}</p>
                  <p className="text-sm text-turquoise font-semibold flex items-center gap-1 mt-1"><Coins className="size-3.5" />{k.credits.toLocaleString('fr-FR')} crédits</p>
                </button>
              ))}
            </div>
            <div className="mt-4"><Field label="Autre Montant (FCFA)" name="amount" type="number" min={p.min} step={100} value={amount} onChange={(e: any) => setAmount(Number(e.target.value) || 0)} hint={`Minimum ${fcfa(p.min)}.`} /></div>
          </section>
          <section className="card p-5 space-y-3">
            <h2 className="font-display font-semibold text-ink">2- Moyen De Paiement</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['wave', 'orange_money'] as const).map((m) => (
                <label key={m} className="rounded-2xl border-2 border-sable-dark p-3 cursor-pointer has-[:checked]:border-turquoise has-[:checked]:bg-turquoise-50 transition">
                  <input type="radio" name="payMethod" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-turquoise" /><span className="font-semibold ml-2">{PAY[m]}</span>
                </label>
              ))}
            </div>
            {!live && <Field label="Référence De Transaction" name="payRef" required minLength={4} placeholder="Après l’envoi au numéro marchand [à confirmer]" error={a?.fields?.payRef} />}
          </section>
          <section className="card p-5" data-reveal="">
            <h2 className="font-display font-semibold text-ink mb-3">Historique</h2>
            <ul className="divide-y divide-sable-dark text-sm">
              {d.ledger.map((l: any, i: number) => (
                <li key={i} className="py-2 flex justify-between gap-3"><span className="text-muted w-24">{dateFr(l.created_at)}</span><span className="flex-1">{KIND[l.kind]}{l.note && l.kind === 'usage' ? ` (${l.note})` : ''}</span><b className={l.delta > 0 ? 'text-turquoise' : 'text-muted'}>{l.delta > 0 ? '+' : ''}{l.delta.toLocaleString('fr-FR')}</b></li>
              ))}
              {d.payments.filter((x: any) => x.status === 'pending').map((x: any) => <li key={x.ref} className="py-2"><Link prefetch="intent" to={`/paiement/${x.ref}`} className="underline">Recharge {x.ref} en vérification</Link></li>)}
            </ul>
          </section>
        </div>
        <aside className="card p-5 h-fit xl:sticky xl:top-36 space-y-4 animate-fade-up">
          <h2 className="font-display font-semibold text-ink">Récapitulatif</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt>Recharge de crédits SM-IA</dt><dd>{fcfa(amount)}</dd></div>
            <div className="flex justify-between"><dt>Commission Sunu-Market ({p.commissionPct} %, taux à confirmer)</dt><dd>{fcfa(q.commission)}</dd></div>
            <div className="flex justify-between border-t border-sable-dark pt-2 font-display font-bold text-lg"><dt>Total À Payer</dt><dd key={amount} className="text-orange animate-pop">{fcfa(amount + q.commission)}</dd></div>
            <div className="flex justify-between text-turquoise font-semibold"><dt>Crédits obtenus</dt><dd>{q.credits.toLocaleString('fr-FR')}</dd></div>
          </dl>
          <p className="text-xs text-muted">Calcul : {fcfa(amount)} × {p.commissionPct} % = {fcfa(q.commission)} de commission, total {fcfa(amount + q.commission)}.</p>
          <button className="btn-primary w-full press" disabled={busy || amount < p.min}><Lock className="size-4" />{live ? `Payer Avec ${PAY[method]}` : 'Déclarer Le Paiement'}</button>
          <p className="text-xs flex gap-2 rounded-xl bg-turquoise-50 text-turquoise p-3"><Sparkles className="size-4 shrink-0" />SM-IA consomme des crédits selon l’usage réel (facturation au token du modèle d’IA). Chaque commerçant paie ses propres crédits.</p>
        </aside>
      </Form>
    </>
  );
}
