// P32 : revenus de la plateforme, paiements à vérifier, remboursements en double validation
import { Form, Link, useActionData, useLoaderData, useSearchParams } from 'react-router';
import { CreditCard, Megaphone, Rocket, TrendingUp, Coins, Download, Lock, Check, X } from 'lucide-react';
import { api, apiOrThrow } from '~/lib/api.server';
import { fcfa, PAY, dateFr } from '~/lib/format';
import { Alert, PageTitle } from '~/components/ui';
import { CountUp, stagger } from '~/components/motion';

export async function loader({ request }: any) {
  const u = new URL(request.url);
  const q = new URLSearchParams();
  if (u.searchParams.get('service')) q.set('purpose', u.searchParams.get('service')!);
  if (u.searchParams.get('statut')) q.set('status', u.searchParams.get('statut')!);
  return apiOrThrow(request, `/admin/revenue?${q}`);
}
export async function action({ request }: any) {
  const f = await request.formData();
  const r = f.get('intent') === 'refund'
    ? await api(request, `/admin/payments/${f.get('id')}/refund`, { json: { reason: f.get('reason') } })
    : await api(request, `/admin/payments/${f.get('id')}/confirm`, { json: { accept: f.get('accept') === '1' } });
  return r.ok ? { ok: r.data.status === 'refund_requested' ? 'Première validation enregistrée : une seconde personne doit valider.' : 'Enregistré.' } : { error: r.data.error };
}
const K: [string, string, any][] = [['subscription', 'Abonnements', CreditCard], ['featured', 'Mise En Avant', Megaphone], ['campaign', 'Campagnes', Rocket], ['ad', 'Publicité', TrendingUp], ['credits', 'Commissions SM-IA', Coins]];
const ST: Record<string, [string, string]> = { paid: ['Payé', 'bg-turquoise-50 text-turquoise'], pending: ['En Attente', 'bg-orange-50 text-orange-dark'], failed: ['Échoué', 'bg-red-50 text-red-700'], expired: ['Expiré', 'bg-sable-dark'], refund_requested: ['Remb. 1 Sur 2', 'bg-orange-50 text-orange-dark'], refunded: ['Remboursé', 'bg-indigo-50 text-indigo'] };

export default function Revenue() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const [sp] = useSearchParams();
  const kp = Object.fromEntries(d.kpi.map((k: any) => [k.purpose, k]));
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); return `?${n}`; };
  return (
    <>
      <PageTitle title="Revenus De La Plateforme" sub="Mois en cours. Pour les recharges SM-IA, seule la commission est un revenu.">
        <a href="/exports/revenus.csv" className="btn-ghost btn-sm"><Download className="size-3.5" />Exporter En CSV</a>
      </PageTitle>
      {a?.ok && <div className="mb-4"><Alert tone="success">{a.ok}</Alert></div>}
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {K.map(([k, l, Icon], i) => (
          <div key={k} className="card p-4" {...stagger(i)}>
            <p className="text-xs text-muted flex items-center gap-1.5"><Icon className="size-4 text-turquoise" />{l}</p>
            <p className="font-display text-xl font-bold text-indigo mt-1"><CountUp value={kp[k]?.amount || 0} format={fcfa} /></p>
            <p className="text-[11px] text-muted">{kp[k]?.n || 0} paiement(s){k === 'credits' && kp[k] ? `, ${fcfa(kp[k].credits_volume)} rechargés` : ''}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-6 mb-3">
        {[['', 'Tous'], ['subscription', 'Abonnements'], ['visibility', 'Visibilité'], ['credits', 'SM-IA']].map(([k, l]) => <Link prefetch="intent" key={l} to={set('service', k)} className={`chip py-1.5 px-3 ${(sp.get('service') || '') === k ? 'bg-indigo text-white' : 'bg-white border border-sable-dark'}`}>{l}</Link>)}
        <span className="w-px bg-sable-dark mx-1" />
        {[['', 'Tous États'], ['pending', 'À Vérifier'], ['paid', 'Payés'], ['refund_requested', 'Remboursements']].map(([k, l]) => <Link prefetch="intent" key={l} to={set('statut', k)} className={`chip py-1.5 px-3 ${(sp.get('statut') || '') === k ? 'bg-orange text-white' : 'bg-white border border-sable-dark'}`}>{l}</Link>)}
      </div>
      <div className="card overflow-x-auto" data-reveal="">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="p-3">Référence</th><th className="p-3">Commerçant</th><th className="p-3">Service</th><th className="p-3">Moyen</th><th className="p-3">Montant</th><th className="p-3">État</th><th className="p-3">Action</th></tr></thead>
          <tbody className="divide-y divide-sable-dark">
            {d.items.map((p: any) => (
              <tr key={p.id} className="hover:bg-sable/50">
                <td className="p-3 font-mono text-xs">{p.ref}<span className="block text-muted font-sans">{dateFr(p.created_at)}</span></td>
                <td className="p-3">{p.merchant}</td>
                <td className="p-3">{p.label}{p.commission_fcfa > 0 && <span className="block text-xs text-muted">commission {fcfa(p.commission_fcfa)}</span>}</td>
                <td className="p-3">{p.provider === 'manual' ? 'Déclaré' : PAY[p.provider]}{p.provider_ref && <span className="block text-xs font-mono text-muted">{p.provider_ref}</span>}</td>
                <td className="p-3 font-semibold whitespace-nowrap">{fcfa(p.total_fcfa)}</td>
                <td className="p-3"><span className={`chip ${ST[p.status]?.[1]}`}>{ST[p.status]?.[0]}</span></td>
                <td className="p-3">
                  {p.status === 'pending' && p.provider === 'manual' && (
                    <Form method="post" className="flex gap-1"><input type="hidden" name="id" value={p.id} />
                      <button name="accept" value="1" className="btn-primary btn-sm" title="Référence retrouvée sur le relevé"><Check className="size-3.5" /></button>
                      <button name="accept" value="0" className="btn-ghost btn-sm" title="Paiement introuvable"><X className="size-3.5" /></button></Form>
                  )}
                  {['paid', 'refund_requested'].includes(p.status) && (
                    <Form method="post" className="flex gap-1"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="intent" value="refund" />
                      <input name="reason" required minLength={5} placeholder="Motif" className="input h-8 w-24 text-xs" /><button className="btn-ghost btn-sm">{p.status === 'paid' ? 'Rembourser' : 'Valider 2/2'}</button></Form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mt-4 flex gap-2"><Lock className="size-4 shrink-0" />Sunu-Market n’encaisse aucune vente entre membres. Seuls les services de la plateforme sont payés ici. Tout remboursement exige une double validation (finance et administrateur).</p>
    </>
  );
}
