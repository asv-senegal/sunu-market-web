// Paramètres de la boutique : vitrine, horaires, lieu de remise, modes de remise et paiements acceptés, mode vacances
import { Form, Link, useActionData, useLoaderData, useNavigation, useRouteLoaderData } from 'react-router';
import { Store, Clock, MapPin, Wallet, Palmtree, ExternalLink, Save } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { QUARTERS, PAY, DELIVERY } from '~/lib/format';
import { Alert, Field } from '~/components/ui';
import { Select } from '~/components/Select';
import type { Cat } from '~/components/Shell';

export const meta = () => [{ title: 'Paramètres De La Boutique | Sunu-Market' }];
export const handle = { title: 'Paramètres' };
export async function loader({ request }: any) { return apiOrThrow(request, '/me/shop?range=7'); }
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/me/shop', { method: 'PATCH', json: {
    name: f.get('name'), description: f.get('description') ?? undefined, quarter: f.get('quarter') || undefined,
    universe: f.get('universe') ? Number(f.get('universe')) : undefined, hours: f.get('hours') ?? undefined, meetingPlace: f.get('meetingPlace') ?? undefined,
    deliveryModes: f.getAll('deliveryModes'), payMethods: f.getAll('payMethods'), vacation: f.get('vacation') === 'on',
  } });
  return r.ok ? { ok: true } : formError(r);
}
const SHOP_DELIVERY: Record<string, string> = { hand: 'Remise en main propre', delivery: 'Livraison', pickup: 'Retrait en boutique' };

export default function ShopSettings() {
  const { shop } = useLoaderData<typeof loader>() as any;
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const { cats } = useRouteLoaderData('root') as { cats: Cat[] };
  const box = 'card p-5 md:p-6 space-y-4';
  const h = 'font-display font-semibold text-ink flex items-center gap-2';
  return (
    <Form method="post" className="space-y-5 max-w-4xl">
      {a?.ok && <Alert tone="success">Paramètres enregistrés.</Alert>}
      {a?.error && <Alert>{a.error}</Alert>}
      <section className={box} data-reveal="">
        <div className="flex items-center justify-between gap-3"><h2 className={h}><Store className="size-5 text-turquoise" />Vitrine</h2>
          <Link prefetch="intent" to={`/b/${shop.slug}`} className="text-[13px] text-orange font-semibold flex items-center gap-1">Voir ma vitrine<ExternalLink className="size-3.5" /></Link></div>
        <Field label="Nom de la boutique" name="name" defaultValue={shop.name} required minLength={3} maxLength={60} error={a?.fields?.name} />
        <Field label="Description"><textarea name="description" rows={3} maxLength={600} defaultValue={shop.description || ''} className="input h-auto py-2.5" placeholder="Ce que vous vendez, vos points forts." /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Quartier"><Select name="quarter" defaultValue={shop.quarter || ''} options={QUARTERS} aria-label="Quartier" /></Field>
          <Field label="Univers principal"><Select name="universe" defaultValue={shop.universe ? String(shop.universe) : ''} aria-label="Univers principal" options={cats.filter((c) => !c.is_shops).map((c) => ({ value: String(c.id), label: c.name }))} /></Field>
        </div>
      </section>
      <section className={box} data-reveal="">
        <h2 className={h}><Clock className="size-5 text-turquoise" />Horaires Et Remise</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Horaires" name="hours" defaultValue={shop.hours || ''} maxLength={120} placeholder="Ex. lundi au samedi, 10 h – 18 h" />
          <Field label="Lieu de remise habituel" name="meetingPlace" defaultValue={shop.meeting_place || ''} maxLength={120} placeholder="Ex. marché de Colobane, entrée principale" />
        </div>
        <fieldset><legend className="label flex items-center gap-1"><MapPin className="size-3.5" />Modes de remise proposés</legend>
          <div className="flex flex-wrap gap-4">{Object.entries(SHOP_DELIVERY).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="deliveryModes" value={k} defaultChecked={(shop.delivery_modes || ['hand']).includes(k)} className="size-4 accent-indigo" />{v}</label>))}</div>
        </fieldset>
        <fieldset><legend className="label flex items-center gap-1"><Wallet className="size-3.5" />Paiements acceptés (directement à vous)</legend>
          <div className="flex flex-wrap gap-4">{Object.entries(PAY).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="payMethods" value={k} defaultChecked={(shop.pay_methods || []).includes(k)} className="size-4 accent-indigo" />{v as string}</label>))}</div>
          <p className="text-xs text-muted mt-1.5">Valeurs proposées par défaut pour vos nouvelles annonces. Sunu-Market n’encaisse jamais vos ventes.</p>
        </fieldset>
      </section>
      <section className="card p-5 md:p-6 flex items-start gap-4" data-reveal="">
        <span className="size-11 rounded-xl bg-[#FDF3D7] text-[#8A5A00] flex items-center justify-center shrink-0"><Palmtree className="size-5" /></span>
        <div className="flex-1"><p className="font-semibold text-sm">Mode Vacances</p><p className="text-xs text-muted">Vos annonces restent visibles mais signalées « commerçant absent » [comportement à confirmer]. SM-IA prévient les clients.</p></div>
        <label className="relative inline-flex w-11 h-6 cursor-pointer"><input type="checkbox" name="vacation" defaultChecked={shop.vacation} className="peer sr-only" />
          <span className="absolute inset-0 rounded-full bg-line peer-checked:bg-turquoise transition-colors" /><span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" /></label>
      </section>
      <button className="btn-primary press" disabled={busy}><Save className="size-4" />{busy ? 'Enregistrement…' : 'Enregistrer Les Paramètres'}</button>
    </Form>
  );
}
