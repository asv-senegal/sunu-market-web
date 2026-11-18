// P27 : Assistant SM-IA (solde, propositions à approuver, autonomie, limites, coupure, journal)
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation, useFetcher } from 'react-router';
import { useEffect, useRef } from 'react';
import { Sparkles, Coins, Check, X, Power, Send, FileText, Bot, AlertTriangle, Download } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { ago } from '~/lib/format';
import { Alert, PageTitle } from '~/components/ui';
import { CountUp, Ring } from '~/components/motion';

export const meta = () => [{ title: 'Assistant SM-IA | Sunu-Market' }];
export const loader = ({ request }: any) => apiOrThrow(request, '/me/smia');
export async function action({ request }: any) {
  const f = await request.formData();
  const intent = f.get('intent');
  if (intent === 'ask') { const r = await api(request, '/me/smia/assistant', { json: { text: f.get('text') } }); return r.ok ? { asked: true } : formError(r); }
  if (intent === 'approve' || intent === 'reject') {
    const r = await api(request, `/me/smia/actions/${f.get('id')}/${intent}`, { method: 'POST' });
    if (!r.ok) return formError(r);
    return r.data.next && intent === 'approve' ? redirect(r.data.next) : { ok: intent === 'approve' ? 'Proposition appliquée.' : 'Proposition refusée.' };
  }
  if (intent === 'power') { await api(request, '/me/smia/power', { json: { on: f.get('on') === '1' } }); return null; }
  const r = await api(request, '/me/smia', { method: 'PATCH', json: { autonomy: Number(f.get('autonomy')), daily_credit_cap: Number(f.get('daily_credit_cap')), min_balance_stop: Number(f.get('min_balance_stop')) } });
  return r.ok ? { ok: 'Réglages enregistrés.' } : formError(r);
}
const LEVELS = [[1, 'Conseiller', 'SM-IA analyse et propose, vous décidez de tout.'], [2, 'Assistant', 'Il prépare des brouillons (annonces, réponses), vous publiez.'], [3, 'Délégué Encadré', 'Il applique seul les textes d’annonces, jamais les prix, annulations ou dépenses.']] as const;
const KIND: Record<string, string> = { featured: 'Mise En Avant', campaign: 'Campagne', listing_update: 'Texte D’Annonce', price_change: 'Changement De Prix', other: 'Conseil', remise_request: 'Demande De Remise', annulation_request: 'Demande D’Annulation', reclamation_request: 'Réclamation', autre_request: 'Demande Transmise' };
const STATUS: Record<string, [string, string]> = { done: ['Autorisé', 'bg-turquoise-50 text-turquoise'], pending: ['En Attente', 'bg-orange-50 text-orange-dark'], approved: ['Approuvé', 'bg-turquoise-50 text-turquoise'], rejected: ['Refusé', 'bg-sable-dark text-muted'], blocked: ['Bloqué, Transmis', 'bg-orange-50 text-orange-dark'] };

export default function Smia() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const nav = useNavigation();
  const ask = useFetcher();
  const askForm = useRef<HTMLFormElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const st = d.settings;
  const askErr = (ask.data as any)?.error;
  useEffect(() => { if (ask.state === 'idle' && (ask.data as any)?.asked) askForm.current?.reset(); }, [ask.state, ask.data]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ block: 'nearest' }); }, [d.chat.length, ask.state]);
  const off = !st.enabled || !d.global.enabled;
  return (
    <>
      <PageTitle title="Assistant SM-IA" sub="Votre conseiller personnel. Rien n’est payé ni publié sans votre accord explicite." />
      {!d.global.configured && <div className="mb-4"><Alert tone="info">SM-IA n’est pas encore configuré sur ce serveur (clé de l’API Anthropic à renseigner par l’administration).</Alert></div>}
      {!d.global.enabled && <div className="mb-4"><Alert>SM-IA est temporairement coupé par l’administration.</Alert></div>}
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      {a?.ok && <div className="mb-4"><Alert tone="success">{a.ok}</Alert></div>}
      <div className="grid xl:grid-cols-[1.1fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="card p-5 bg-indigo text-white border-indigo flex items-center gap-5 relative overflow-hidden animate-fade-up">
            <div className="absolute -right-12 -top-12 size-44 rounded-full bg-turquoise/30 blur-2xl floaty" aria-hidden="true" />
            <Ring value={d.balance} max={Math.max(d.balance, 2000)} color="var(--color-turquoise)" size={104}><Coins className="size-6 text-white/80" /></Ring>
            <div className="flex-1 relative">
              <p className="text-white/70 text-sm">Solde De Crédits SM-IA</p>
              <p className="font-display text-4xl font-bold"><CountUp value={d.balance} /></p>
              <p className="text-xs text-white/70 mt-1">{d.daysLeft != null ? `Environ ${d.daysLeft} jours d’usage au rythme actuel.` : 'Facturation au token, selon l’usage réel.'} Aujourd’hui : {d.usedToday} / {st.daily_credit_cap}.</p>
            </div>
            <Link prefetch="intent" to="/ma-boutique/sm-ia/recharger" className="btn-primary btn-sm relative press">Recharger</Link>
          </div>

          {d.pending.map((p: any, i: number) => (
            <div key={p.id} className="card p-5 border-turquoise/40 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <p className="text-xs font-semibold text-turquoise flex items-center gap-1.5"><Sparkles className="size-4" />Proposition De SM-IA · {KIND[p.kind] || p.kind}<span className="text-muted font-normal ml-auto">{ago(p.created_at)}</span></p>
              <p className="mt-2 text-sm">{p.summary}</p>
              {p.payload?.title && <p className="mt-2 text-sm rounded-xl bg-sable p-3"><b>{p.payload.title}</b>{p.payload.description && <span className="block text-muted mt-1 line-clamp-3">{p.payload.description}</span>}</p>}
              {p.payload?.price_fcfa != null && <p className="text-sm mt-1">Nouveau prix proposé : <b>{p.payload.price_fcfa.toLocaleString('fr-FR')} FCFA</b></p>}
              <Form method="post" className="flex gap-2 mt-3"><input type="hidden" name="id" value={p.id} />
                <button name="intent" value="approve" className="btn-indigo btn-sm press"><Check className="size-3.5" />{['featured', 'campaign'].includes(p.kind) ? 'Approuver Et Payer' : p.conversation_id ? 'Ouvrir SM-Chat' : 'Approuver'}</button>
                <button name="intent" value="reject" className="btn-ghost btn-sm"><X className="size-3.5" />Refuser</button>
              </Form>
              <p className="text-[11px] text-muted mt-2">Rien n’est payé ni publié sans votre accord explicite.</p>
            </div>
          ))}

          <div className="card p-5">
            <h2 className="font-display font-semibold text-indigo flex items-center gap-2"><Bot className="size-5 text-turquoise" />Demander À SM-IA</h2>
            <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-1">
              {d.chat.length === 0 && <p className="text-sm text-muted">Exemples : « Comment mieux vendre mon beurre de karité ? », « Quelles annonces améliorer avant la Tabaski ? »</p>}
              {d.chat.map((m: any, i: number) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : ''} animate-pop`}>
                  <p className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line ${m.role === 'user' ? 'bg-indigo text-white' : 'bg-turquoise-50 border border-turquoise/30'}`}>
                    {m.role === 'assistant' && <span className="text-[11px] font-semibold text-turquoise flex items-center gap-1 mb-0.5"><Sparkles className="size-3" />SM-IA · {m.credits} crédits</span>}{m.content}
                  </p>
                </div>
              ))}
              {ask.state !== 'idle' && <div className="flex gap-1 p-3 w-16 rounded-2xl bg-turquoise-50">{[0, 1, 2].map((k) => <span key={k} className="size-2 rounded-full bg-turquoise animate-bounce" style={{ animationDelay: `${k * 120}ms` }} />)}</div>}
              <div ref={chatEnd} />
            </div>
            {askErr && <p className="text-xs text-red-700 mt-2">{askErr}</p>}
            <ask.Form ref={askForm} method="post" className="flex gap-2 mt-3">
              <input type="hidden" name="intent" value="ask" />
              <input name="text" required minLength={2} maxLength={1000} placeholder="Votre question…" className="input rounded-full" disabled={off} aria-label="Question à SM-IA" />
              <button className="btn-primary rounded-full w-11 px-0 press" disabled={off || ask.state !== 'idle'} aria-label="Envoyer"><Send className="size-4" /></button>
            </ask.Form>
          </div>
        </div>

        <div className="space-y-5">
          <Form method="post" className="card p-5 space-y-4" data-reveal="right">
            <h2 className="font-display font-semibold text-indigo">Niveau D’Autonomie</h2>
            {LEVELS.map(([n, t, s]) => (
              <label key={n} className="flex gap-3 rounded-2xl border-2 border-sable-dark p-3 cursor-pointer has-[:checked]:border-indigo has-[:checked]:bg-indigo-50 transition">
                <input type="radio" name="autonomy" value={n} defaultChecked={st.autonomy === n} className="accent-indigo mt-1" />
                <span><span className="font-semibold text-sm">{t}</span> <span className="chip bg-sable-dark text-[10px] ml-1">Niveau {n}</span><span className="block text-xs text-muted">{s}</span></span>
              </label>
            ))}
            <h3 className="font-display font-semibold text-indigo pt-2">Limites Et Contrôle</h3>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="label">Crédits Maximum Par Jour</span><input name="daily_credit_cap" type="number" min={0} defaultValue={st.daily_credit_cap} className="input" /></label>
              <label><span className="label">Arrêt Sous (Crédits)</span><input name="min_balance_stop" type="number" min={0} defaultValue={st.min_balance_stop} className="input" /></label>
            </div>
            <button className="btn-indigo btn-sm" disabled={nav.state !== 'idle'}>Enregistrer</button>
          </Form>

          <div className={`card p-5 flex items-center gap-4 ${st.enabled ? 'border-red-200' : 'border-turquoise/40'}`} data-reveal="right">
            <span className={`size-11 rounded-xl flex items-center justify-center ${st.enabled ? 'bg-red-50 text-red-700' : 'bg-turquoise-50 text-turquoise'}`}><Power className="size-5" /></span>
            <div className="flex-1"><p className="font-semibold text-sm">{st.enabled ? 'Couper SM-IA Maintenant' : 'SM-IA Est Coupé'}</p><p className="text-xs text-muted">Effet immédiat sur toutes les fonctions, réactivable à tout moment.</p></div>
            <Form method="post"><input type="hidden" name="intent" value="power" /><input type="hidden" name="on" value={st.enabled ? '0' : '1'} />
              <button className={`btn-sm btn press ${st.enabled ? 'bg-red-700 text-white' : 'btn-primary'}`}>{st.enabled ? 'Couper' : 'Réactiver'}</button></Form>
          </div>

          <div className="card p-5" data-reveal="right">
            <div className="flex items-center justify-between mb-3"><h2 className="font-display font-semibold text-indigo flex items-center gap-2"><FileText className="size-4" />Journal Des Actions</h2><a href="/exports/journal-sm-ia.csv" className="btn-ghost btn-sm"><Download className="size-3.5" />Exporter</a></div>
            {d.journal.length ? (
              <ul className="divide-y divide-sable-dark text-sm">
                {d.journal.slice(0, 12).map((j: any) => (
                  <li key={j.id} className="py-2 flex items-center gap-3">
                    <span className="text-xs text-muted w-20 shrink-0">{ago(j.created_at)}</span>
                    <span className="flex-1 min-w-0 truncate">{j.summary}</span>
                    {j.credits > 0 && <span className="text-xs text-muted">{j.credits} cr.</span>}
                    {STATUS[j.status] && <span className={`chip ${STATUS[j.status][1]}`}>{STATUS[j.status][0]}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted flex items-center gap-2"><AlertTriangle className="size-4" />Aucune action pour le moment.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
