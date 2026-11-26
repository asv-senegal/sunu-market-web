// P26 : abonnement annuel, 14 jours d'essai, paiement Wave ou Orange Money
import { Form, redirect, useActionData, useLoaderData, useNavigation, Link } from 'react-router';
import { useState } from 'react';
import { CheckCircle2, Info, Gift, BadgeCheck } from 'lucide-react';
import { api, apiOrThrow, formError, idemOf, newIdem } from '~/lib/api.server';
import { fcfa, dateFr, PAY } from '~/lib/format';
import { Alert, Field } from '~/components/ui';
import { Ring } from '~/components/motion';

export const handle = { title: 'Abonnement' };
export const meta = () => [{ title: 'Abonnement | Sunu-Market' }];
export const loader = async ({ request }: any) => ({ ...(await apiOrThrow(request, '/me/subscription')), idem: newIdem() });
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/me/subscription', { json: { payMethod: f.get('payMethod'), payRef: f.get('payRef') || undefined }, idem: idemOf(f) });
  if (!r.ok) return formError(r);
  // API du prestataire configurée : redirection vers la page de paiement Wave ou Orange Money
  if (r.data.payment.checkout_url) return redirect(r.data.payment.checkout_url);
  return redirect(`/paiement/${r.data.payment.ref}`);
}
const KIND: Record<string, string> = { trial: 'Essai Gratuit', annual: 'Abonnement Annuel' };
const ST: Record<string, string> = { active: 'Actif', cancelled: 'Annulé', pending: 'En Vérification', paid: 'Payé', failed: 'Échoué', refunded: 'Remboursé', refund_requested: 'Remboursement Demandé', expired: 'Expiré' };
const FEATURES = (credits: number) => ['Boutique et badge Compte Vérifié', 'Annonces illimitées [à confirmer]', 'SM-Chat avec vos clients', `${credits.toLocaleString('fr-FR')} crédits SM-IA inclus`, 'Accès aux campagnes et à la mise en avant', 'Statistiques de la boutique'];

export default function Subscription() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const [method, setMethod] = useState<'wave' | 'orange_money'>('wave');
  const cur = d.current;
  const total = cur ? (new Date(cur.ends_at).getTime() - new Date(cur.starts_at).getTime()) / 864e5 : 14;
  const left = cur ? Math.max(0, Math.ceil((new Date(cur.ends_at).getTime() - Date.now()) / 864e5)) : 0;
  const pending = d.payments.some((p: any) => p.status === 'pending' && p.provider === 'manual');
  const live = d.live[method];
  return (
    <>
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className="card p-6 bg-indigo text-white border-indigo relative overflow-hidden animate-fade-up">
          <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-orange/25 blur-2xl floaty" aria-hidden="true" />
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Ring value={left} max={total} color="var(--color-orange)"><span className="font-display text-2xl font-bold">{left}</span><span className="text-[10px] text-white/70">jours</span></Ring>
            <div className="min-w-0">
              {cur?.kind === 'trial' && <span className="chip bg-white/15 text-white"><Gift className="size-3" />Essai : {left} jours restants</span>}
              <p className="text-white/70 text-sm mt-2">Abonnement Annuel Commerçant</p>
              <p className="font-display text-3xl sm:text-4xl font-bold">{fcfa(d.price)}<span className="text-base font-normal text-white/70"> / an</span></p>
              <p className="text-sm text-white/70">Soit environ {fcfa(Math.round(d.price / 12))} par mois. Aucune commission sur vos ventes.</p>
            </div>
          </div>
          <ul className="mt-6 space-y-2 text-sm relative">
            {FEATURES(d.credits).map((t, i) => <li key={t} className="flex gap-2" data-reveal="left" style={{ '--d': `${i * 60}ms` } as React.CSSProperties}><CheckCircle2 className="size-4 text-orange-50 shrink-0 mt-0.5" />{t}</li>)}
          </ul>
          <p className="mt-5 text-sm relative">{cur ? <>Statut : <b>{KIND[cur.kind]}</b> jusqu’au <b>{dateFr(cur.ends_at)}</b>.</> : <b>Abonnement expiré : vos annonces sont masquées.</b>}</p>
        </div>
        <div className="card p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h2 className="font-display font-semibold text-ink">Activer L’Abonnement</h2>
          {a?.error && <div className="mt-3"><Alert>{a.error}</Alert></div>}
          {pending ? <div className="mt-4"><Alert tone="info">Un paiement est en cours de vérification par l’équipe.</Alert></div> : (
            <Form method="post" className="mt-4 space-y-4">
              <input type="hidden" name="idem" value={d.idem} />
              <div className="grid grid-cols-2 gap-2">
                {(['wave', 'orange_money'] as const).map((p) => (
                  <label key={p} className="rounded-2xl border-2 border-sable-dark p-3 cursor-pointer has-[:checked]:border-turquoise has-[:checked]:bg-turquoise-50 transition">
                    <input type="radio" name="payMethod" value={p} checked={method === p} onChange={() => setMethod(p)} className="accent-turquoise" />
                    <span className="font-semibold ml-2">{PAY[p]}</span>
                    <span className="block text-xs text-muted mt-1">{d.live[p] ? (p === 'wave' ? 'Validation dans l’application Wave' : 'Code USSD ou application') : 'Envoi puis référence'}</span>
                  </label>
                ))}
              </div>
              {!live && (
                <div className="space-y-3 animate-fade-up">
                  <ol className="text-sm text-ink/85 space-y-1 list-none">
                    <li>1- Envoyez {fcfa(d.price)} par {PAY[method]} au numéro marchand Sunu-Market [à confirmer].</li>
                    <li>2- Saisissez la référence reçue par SMS.</li>
                    <li>3- L’équipe confirme ; l’année démarre à la fin de votre période en cours.</li>
                  </ol>
                  <Field label="Référence De Transaction" name="payRef" required minLength={4} maxLength={60} placeholder="Référence reçue par SMS" error={a?.fields?.payRef} />
                </div>
              )}
              <button className="btn-primary w-full press" disabled={busy}>{live ? `Payer ${fcfa(d.price)} Avec ${PAY[method]}` : 'Déclarer Mon Paiement'}</button>
              <p className="text-xs text-muted flex gap-1.5"><Info className="size-4 shrink-0" />Sunu-Market n’encaisse que ses services. Vos ventes vous sont payées directement.</p>
            </Form>
          )}
          <div className="mt-6 pt-5 border-t border-sable-dark">
            <h3 className="text-sm font-semibold text-indigo mb-3">Comment Ça Marche</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="size-6 rounded-full bg-turquoise text-white flex items-center justify-center"><BadgeCheck className="size-3.5" /></span>Compte vérifié</li>
              <li className="flex gap-3"><span className="size-6 rounded-full bg-orange text-white flex items-center justify-center"><Gift className="size-3.5" /></span>14 jours d’essai gratuit</li>
              <li className="flex gap-3"><span className="size-6 rounded-full bg-sable-dark text-muted flex items-center justify-center text-xs font-bold">3</span>Abonnement annuel ; sinon la boutique passe hors ligne</li>
            </ol>
          </div>
        </div>
      </div>
      <h2 className="font-display font-semibold text-ink mt-8 mb-3">Historique</h2>
      <div className="card overflow-x-auto" data-reveal="">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="p-3">Type</th><th className="p-3">Montant</th><th className="p-3">Période</th><th className="p-3">Statut</th></tr></thead>
          <tbody className="divide-y divide-sable-dark">
            {d.history.map((h: any) => (<tr key={h.id}><td className="p-3">{KIND[h.kind]}</td><td className="p-3">{fcfa(h.amount_fcfa)}</td><td className="p-3">{dateFr(h.starts_at)} – {dateFr(h.ends_at)}</td><td className="p-3">{ST[h.status]}</td></tr>))}
            {d.payments.filter((p: any) => p.status !== 'paid').map((p: any) => (<tr key={p.ref}><td className="p-3"><Link prefetch="intent" to={`/paiement/${p.ref}`} className="underline">Paiement {p.ref}</Link></td><td className="p-3">{fcfa(p.total_fcfa)}</td><td className="p-3">{dateFr(p.created_at)}</td><td className="p-3">{ST[p.status]}</td></tr>))}
          </tbody>
        </table>
      </div>
    </>
  );
}
