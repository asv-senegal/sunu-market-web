// P34 : SM-IA et crédits côté administration (coûts, journal global, réglages, coupure générale)
import { Form, useActionData, useLoaderData, useNavigation } from 'react-router';
import { Coins, Wallet, BarChart3, Sparkles, Power, AlertTriangle } from 'lucide-react';
import { api, apiOrThrow } from '~/lib/api.server';
import { fcfa, ago } from '~/lib/format';
import { Alert, Toolbar } from '~/components/ui';
import { CountUp, stagger } from '~/components/motion';

export const handle = { title: 'SM-IA Et Crédits' };
export async function loader({ request }: any) {
  const [s, set] = await Promise.all([apiOrThrow(request, '/admin/smia'), api(request, '/admin/settings')]);
  return { ...s, settings: set.ok ? Object.fromEntries(set.data.items.map((x: any) => [x.key, x])) : null };
}
export async function action({ request }: any) {
  const f = await request.formData();
  if (f.get('intent') === 'power') { await api(request, '/admin/smia/power', { json: { on: f.get('on') === '1' } }); return { ok: f.get('on') === '1' ? 'SM-IA réactivé.' : 'Toute l’IA est coupée.' }; }
  const keys = ['smia_chatbot_enabled', 'smia_assistant_enabled', 'smia_moderation_enabled', 'smia_kyc_precheck_enabled'];
  for (const k of keys) await api(request, `/admin/settings/${k}`, { method: 'PATCH', json: { value: f.get(k) === 'on' } });
  for (const k of ['smia_recharge_commission_pct', 'smia_max_order_fcfa', 'smia_credits_per_1000_fcfa', 'usd_xof']) if (f.get(k)) await api(request, `/admin/settings/${k}`, { method: 'PATCH', json: { value: Number(f.get(k)) } });
  if (f.get('smia_model')) await api(request, '/admin/settings/smia_model', { method: 'PATCH', json: { value: String(f.get('smia_model')) } });
  return { ok: 'Réglages enregistrés et journalisés.' };
}
const SRC: Record<string, string> = { chatbot: 'SM-IA Commandes', assistant: 'Assistant', moderation: 'Modération catalogue', kyc_precheck: 'Pré-contrôle identité' };
const STATUS: Record<string, [string, string]> = { done: ['Autorisé', 'bg-turquoise-50 text-turquoise'], pending: ['Transmis', 'bg-orange-50 text-orange-dark'], blocked: ['Bloqué, Transmis', 'bg-orange-50 text-orange-dark'], flagged: ['Signalé', 'bg-[#FCF1D8] text-[#8A5B00]'], advice: ['Avis Seulement', 'bg-indigo-50 text-indigo'], approved: ['Approuvé', 'bg-turquoise-50 text-turquoise'], rejected: ['Refusé', 'bg-sable-dark'] };

export default function AdminSmia() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const s = d.settings || {};
  const on = s.smia_enabled?.value !== false;
  const k = d.kpi;
  const Toggle = ({ name, label }: any) => (
    <label className="flex items-center justify-between py-2.5 cursor-pointer"><span className="text-sm">{label}</span>
      <input type="checkbox" name={name} defaultChecked={!!s[name]?.value} className="peer sr-only" />
      <span className="w-11 h-6 rounded-full bg-sable-dark relative transition-colors peer-checked:bg-turquoise after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
  const Num = ({ name, label, suffix }: any) => (
    <label className="block"><span className="label">{label} {s[name] && !s[name].confirmed && <span className="chip bg-[#FCF1D8] text-[#8A5B00] text-[10px]">À Confirmer</span>}</span>
      <div className="relative"><input name={name} defaultValue={s[name]?.value ?? ''} className="input pr-16" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{suffix}</span></div></label>
  );
  return (
    <>
      <Toolbar sub="Facturation au token : chaque commerçant paie ses crédits ; la modération et le pré-contrôle sont payés par la plateforme." />
      {!d.configured && <div className="mb-4"><Alert tone="info">Clé de l’API Anthropic absente : renseignez ANTHROPIC_API_KEY dans la configuration du serveur.</Alert></div>}
      {a?.ok && <div className="mb-4"><Alert tone="success">{a.ok}</Alert></div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[[Coins, 'Recharges Du Mois', k.recharges_month, 'hors commission', true], [Wallet, 'Commissions Perçues', k.commissions_month, `${s.smia_recharge_commission_pct?.value ?? 1} % des recharges`, true],
          [BarChart3, 'Coût API Du Mois', k.cost_fcfa_month, `${k.cost_usd_month.toFixed(4)} $, ${k.credits_used_month.toLocaleString('fr-FR')} crédits débités`, true], [Sparkles, 'Actions SM-IA (24 h)', k.actions_24h, `${k.shops_24h} boutique(s), ${k.errors_24h} erreur(s)`, false]].map(([Icon, l, v, n, money]: any, i) => (
          <div key={l} className="card p-4" {...stagger(i)}>
            <p className="text-xs text-muted flex items-center gap-1.5"><Icon className="size-4 text-turquoise" />{l}</p>
            <p className="font-display text-xl font-bold text-indigo mt-1"><CountUp value={v} format={money ? fcfa : undefined} /></p><p className="text-[11px] text-muted">{n}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted mt-2">Crédits restant dus aux commerçants : {k.credits_outstanding.toLocaleString('fr-FR')}.</p>
      <div className="grid xl:grid-cols-[1.4fr_1fr] gap-6 mt-6">
        <div className="card p-5" data-reveal="">
          <h2 className="font-display font-semibold text-ink mb-3">Journal Global Des Actions</h2>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className="py-2">Heure</th><th>Source</th><th>Action</th><th>Résultat</th></tr></thead>
            <tbody className="divide-y divide-sable-dark">
              {d.journal.map((j: any) => (
                <tr key={j.id}><td className="py-2 text-xs text-muted whitespace-nowrap pr-2">{ago(j.created_at)}</td><td className="pr-2">{SRC[j.source]}{j.shop !== 'Plateforme' && <span className="block text-xs text-muted">{j.shop}</span>}</td>
                  <td className="pr-2 max-w-xs truncate">{j.summary}</td><td><span className={`chip ${STATUS[j.status]?.[1]}`}>{STATUS[j.status]?.[0]}</span></td></tr>
              ))}
            </tbody>
          </table></div>
          {d.byFeature.length > 0 && <p className="text-xs text-muted mt-3">Ce mois : {d.byFeature.map((f: any) => `${SRC[f.feature] || f.feature} ${f.calls} appels (${f.cost_usd.toFixed(4)} $)`).join(' · ')}</p>}
        </div>
        <div className="space-y-5">
          {d.settings ? (
            <Form method="post" className="card p-5 space-y-3" data-reveal="right">
              <h2 className="font-display font-semibold text-ink">Réglages</h2>
              <div className="divide-y divide-sable-dark">
                <Toggle name="smia_chatbot_enabled" label="SM-IA Commandes" />
                <Toggle name="smia_assistant_enabled" label="Assistant SM-IA (propositions)" />
                <Toggle name="smia_moderation_enabled" label="Modération automatique du catalogue" />
                <Toggle name="smia_kyc_precheck_enabled" label="Pré-contrôle des identités (avis seulement)" />
              </div>
              <p className="text-[11px] text-muted flex gap-1.5"><AlertTriangle className="size-3.5 shrink-0 text-orange" />Le pré-contrôle envoie des images d’identité au prestataire d’IA : à activer seulement après validation des formalités de la CDP (loi n° 2008-12).</p>
              <div className="grid grid-cols-2 gap-3">
                <Num name="smia_recharge_commission_pct" label="Commission Recharge" suffix="%" />
                <Num name="smia_max_order_fcfa" label="Maximum Accepté Seul" suffix="FCFA" />
                <Num name="smia_credits_per_1000_fcfa" label="Crédits Pour 1 000 FCFA" suffix="crédits" />
                <Num name="usd_xof" label="Taux USD" suffix="FCFA" />
              </div>
              <label className="block"><span className="label">Modèle</span><input name="smia_model" defaultValue={s.smia_model?.value} className="input font-mono text-xs" /></label>
              <button className="btn-indigo btn-sm" disabled={busy}>Enregistrer</button>
            </Form>
          ) : <Alert tone="info">Réglages réservés à l’administrateur.</Alert>}
          <div className={`card p-5 ${on ? 'bg-red-50 border-red-200' : 'bg-turquoise-50 border-turquoise/30'}`} data-reveal="right">
            <p className="font-display font-semibold flex items-center gap-2"><Power className="size-5" />Coupure Générale De SM-IA</p>
            <p className="text-sm text-muted mt-1">{on ? 'Arrête immédiatement toutes les actions automatiques, pour tous les commerçants.' : 'Toute l’IA est actuellement coupée.'}</p>
            <Form method="post" className="mt-3"><input type="hidden" name="intent" value="power" /><input type="hidden" name="on" value={on ? '0' : '1'} />
              <button className={`btn w-full press ${on ? 'bg-red-700 text-white' : 'btn-primary'}`} onClick={(e) => { if (on && !confirm('Couper toute l’IA maintenant ?')) e.preventDefault(); }}>{on ? 'Couper Toute L’IA' : 'Réactiver SM-IA'}</button></Form>
          </div>
        </div>
      </div>
    </>
  );
}
