// P24 : SM-IA Commandes, le chatbot de commande qui répond dans SM-Chat dans les limites fixées par le commerçant
import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router';
import { Bot, Lock, Power, Download, MessageCircle } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { ago } from '~/lib/format';
import { Alert, PageTitle } from '~/components/ui';
import { CountUp, stagger } from '~/components/motion';
import { Select } from '~/components/Select';

export const meta = () => [{ title: 'SM-IA Commandes | Sunu-Market' }];
export const loader = ({ request }: any) => apiOrThrow(request, '/me/smia');
export async function action({ request }: any) {
  const f = await request.formData();
  if (f.get('intent') === 'power') { await api(request, '/me/smia/power', { json: { on: f.get('on') === '1' } }); return null; }
  const b = (k: string) => f.get(k) === 'on';
  const r = await api(request, '/me/smia', { method: 'PATCH', json: {
    chatbot_enabled: b('chatbot_enabled'), chatbot_mode: f.get('chatbot_mode'), perm_answer: b('perm_answer'), perm_accept: b('perm_accept'), perm_meeting: b('perm_meeting'),
    max_order_fcfa: Number(f.get('max_order_fcfa')), min_balance_stop: Number(f.get('min_balance_stop')), meeting_info: String(f.get('meeting_info') || ''),
  } });
  return r.ok ? { ok: 'Réglages enregistrés. Ils s’appliquent immédiatement.' } : formError(r);
}

function Toggle({ name, defaultChecked, label, sub }: any) {
  return (
    <label className="flex items-center gap-4 py-3 cursor-pointer">
      <span className="flex-1"><span className="font-semibold text-sm block">{label}</span><span className="text-xs text-muted">{sub}</span></span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="w-11 h-6 rounded-full bg-sable-dark relative transition-colors peer-checked:bg-turquoise after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-turquoise" />
    </label>
  );
}
const STATUS: Record<string, [string, string]> = { done: ['Autorisé', 'bg-turquoise-50 text-turquoise'], pending: ['En Attente', 'bg-orange-50 text-orange-dark'], blocked: ['Bloqué, Transmis', 'bg-orange-50 text-orange-dark'], approved: ['Approuvé', 'bg-turquoise-50 text-turquoise'], rejected: ['Refusé', 'bg-sable-dark text-muted'] };

export default function SmiaOrders() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const st = d.settings;
  const log = d.journal.filter((j: any) => j.source === 'chatbot');
  return (
    <>
      <PageTitle title="SM-IA Commandes" sub="SM-IA répond à vos clients dans SM-Chat quand vous êtes hors ligne ou en remise." />
      {a?.ok && <div className="mb-4"><Alert tone="success">{a.ok}</Alert></div>}
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      <div className="grid xl:grid-cols-[1fr_1.1fr] gap-6">
        <Form method="post" className="space-y-5">
          <div className="card p-5 bg-indigo text-white border-indigo animate-fade-up">
            <div className="flex items-center gap-3">
              <span className={`size-11 rounded-xl bg-white/15 flex items-center justify-center ${st.chatbot_enabled && st.enabled ? 'live-dot' : ''}`}><Bot className="size-6" /></span>
              <div className="flex-1"><p className="font-display font-semibold">SM-IA Répond À Vos Clients</p><p className="text-xs text-white/70">{st.chatbot_enabled && st.enabled ? 'Actif' : 'Inactif'} · solde {d.balance.toLocaleString('fr-FR')} crédits</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5 text-center">
              {[[d.stats.replies, 'Messages traités'], [d.stats.accepted, 'Commandes acceptées'], [d.stats.used_30d, 'Crédits utilisés']].map(([v, l], i) => (
                <div key={String(l)} className="rounded-xl bg-white/10 p-3" {...stagger(i)}><p className="font-display text-2xl font-bold"><CountUp value={Number(v)} /></p><p className="text-[11px] text-white/70">{l} (30 j)</p></div>
              ))}
            </div>
          </div>
          <div className="card px-5 divide-y divide-sable-dark">
            <Toggle name="chatbot_enabled" defaultChecked={st.chatbot_enabled} label="Activer SM-IA Commandes" sub="Réponses étiquetées « SM-IA » dans SM-Chat" />
            <label className="flex items-center gap-4 py-3"><span className="flex-1 font-semibold text-sm">Quand Répondre</span>
              <Select name="chatbot_mode" size="sm" className="w-56" defaultValue={st.chatbot_mode} aria-label="Quand répondre" options={[{ value: 'offline', label: 'Quand je suis hors ligne' }, { value: 'always', label: 'Toujours' }]} /></label>
          </div>
          <div className="card px-5 divide-y divide-sable-dark" data-reveal="">
            <p className="font-display font-semibold text-indigo py-3">Ce Que SM-IA Peut Faire Seul</p>
            <Toggle name="perm_answer" defaultChecked={st.perm_answer} label="Répondre sur la disponibilité et le prix affiché" sub="Uniquement avec les informations de vos annonces" />
            <Toggle name="perm_accept" defaultChecked={st.perm_accept} label="Accepter une commande au prix affiché" sub="Si le stock est suffisant et sous votre plafond" />
            <Toggle name="perm_meeting" defaultChecked={st.perm_meeting} label="Proposer un rendez-vous de remise" sub="Dans vos créneaux et quartiers" />
            {[['Accorder une remise ou changer un prix', 'SM-IA vous demande toujours'], ['Annuler une commande', 'Toujours décidé par vous']].map(([t, s]) => (
              <div key={t} className="flex items-center gap-4 py-3"><span className="flex-1"><span className="font-semibold text-sm block">{t}</span><span className="text-xs text-muted">{s}</span></span><span className="chip bg-orange-50 text-orange-dark"><Lock className="size-3" />Votre Accord Requis</span></div>
            ))}
          </div>
          <div className="card p-5 space-y-3" data-reveal="">
            <p className="font-display font-semibold text-indigo">Limites</p>
            <label className="block"><span className="label">Montant Maximal D’Une Commande Acceptée Seule (FCFA)</span><input name="max_order_fcfa" type="number" min={0} defaultValue={st.max_order_fcfa} className="input" /></label>
            <label className="block"><span className="label">Arrêter SM-IA Si Le Solde Descend Sous (Crédits)</span><input name="min_balance_stop" type="number" min={0} defaultValue={st.min_balance_stop} className="input" /></label>
            <label className="block"><span className="label">Vos Créneaux Et Lieux De Remise</span><textarea name="meeting_info" rows={2} maxLength={400} defaultValue={st.meeting_info || ''} className="input h-auto py-2" placeholder="Ex. du lundi au samedi, 10 h – 18 h, marché de Colobane ou Parcelles U15" /></label>
            <button className="btn-primary press" disabled={busy}>Enregistrer</button>
          </div>
        </Form>
        <div className="space-y-5">
          <div className="card p-5" data-reveal="right">
            <div className="flex items-center justify-between mb-3"><h2 className="font-display font-semibold text-indigo">Journal Des Actions</h2><a href="/exports/journal-sm-ia.csv" className="btn-ghost btn-sm"><Download className="size-3.5" />Exporter</a></div>
            {log.length ? (
              <ul className="space-y-2">
                {log.slice(0, 15).map((j: any, i: number) => (
                  <li key={j.id} className="flex items-center gap-3 rounded-xl bg-sable/70 p-3 text-sm" {...stagger(i, 40)}>
                    <span className="text-xs text-muted w-20 shrink-0">{ago(j.created_at)}</span>
                    <span className="flex-1 min-w-0 truncate">{j.summary}</span>
                    {j.credits > 0 && <span className="text-xs text-muted whitespace-nowrap">{j.credits} cr.</span>}
                    <span className={`chip ${STATUS[j.status]?.[1] || ''}`}>{STATUS[j.status]?.[0] || j.status}</span>
                    {j.conversation_id && <Link prefetch="intent" to={`/messages/${j.conversation_id}`} aria-label="Ouvrir la conversation"><MessageCircle className="size-4 text-indigo" /></Link>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">SM-IA n’a encore traité aucun message.</p>}
          </div>
          <div className="card p-5 flex items-center gap-4 border-red-200" data-reveal="right">
            <span className="size-11 rounded-xl bg-red-50 text-red-700 flex items-center justify-center"><Power className="size-5" /></span>
            <div className="flex-1"><p className="font-semibold text-sm">{st.enabled ? 'Couper SM-IA Maintenant' : 'SM-IA Est Coupé'}</p><p className="text-xs text-muted">Effet immédiat, réactivable à tout moment.</p></div>
            <Form method="post"><input type="hidden" name="intent" value="power" /><input type="hidden" name="on" value={st.enabled ? '0' : '1'} />
              <button className={`btn-sm btn press ${st.enabled ? 'bg-red-700 text-white' : 'btn-primary'}`}>{st.enabled ? 'Couper' : 'Réactiver'}</button></Form>
          </div>
        </div>
      </div>
    </>
  );
}
