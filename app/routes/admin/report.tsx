// P33 : traitement d'un signalement (deux versions, preuves, chronologie, décision motivée)
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';
import { useState } from 'react';
import { ArrowLeft, Clock, Wallet, MessageCircle, Send, Check, Flag, FileText } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { REPORT_REASON, fcfa, dateFr, timeFr, PAY } from '~/lib/format';
import { Alert } from '~/components/ui';
import { Select } from '~/components/Select';

export const loader = ({ request, params }: any) => apiOrThrow(request, `/admin/reports/${params.id}`);
export async function action({ request, params }: any) {
  const f = await request.formData();
  if (f.get('intent') === 'ask') { const r = await api(request, `/admin/reports/${params.id}/messages`, { json: { to: f.get('to'), body: f.get('body') } }); return r.ok ? { ok: 'Demande envoyée.' } : formError(r); }
  const r = await api(request, `/admin/reports/${params.id}/decision`, { json: { decision: f.get('decision'), note: f.get('note') } });
  return r.ok ? redirect('/admin/signalements') : formError(r);
}
const DEC = [['dismiss', 'Classer', 'Signalement non fondé'], ['warn', 'Avertir', 'Et demander une solution amiable'], ['remove', 'Retirer L’Annonce', 'Annonce non conforme'], ['suspend', 'Suspendre Le Compte', 'Récidive ou fraude']];

function Party({ title, p, messages, party, evidence }: any) {
  return (
    <div className="card p-5 space-y-3 animate-fade-up">
      <div className="flex items-center gap-3">
        <span className="size-10 rounded-full bg-indigo text-white flex items-center justify-center font-semibold">{p?.name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2) || 'IA'}</span>
        <div><p className="font-semibold text-sm">{title} : {p?.name || 'SM-IA (signalement automatique)'}</p>
          {p && <p className="text-xs text-muted">{p.verification_status === 'verified' ? 'Compte vérifié' : 'Non vérifié'}, {p.purchases} achats, {p.sales} ventes{p.rating ? `, ${p.rating} sur 5` : ''}, {p.reports_against} signalement(s) reçu(s)</p>}</div>
      </div>
      {messages.filter((m: any) => m.party === party).map((m: any, i: number) => <p key={i} className="text-sm rounded-xl bg-sable p-3">« {m.body} » <span className="text-xs text-muted block">{dateFr(m.created_at)} {timeFr(m.created_at)}</span></p>)}
      {evidence.length > 0 && <div className="flex gap-2 flex-wrap">{evidence.map((e: any) => <a key={e.id} href={`/preuve/${e.id}`} target="_blank" rel="noreferrer"><img src={`/preuve/${e.id}`} alt="Preuve" className="size-20 rounded-xl object-cover hover:scale-105 transition-transform" /></a>)}</div>}
    </div>
  );
}

export default function Report() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const [dec, setDec] = useState('warn');
  const r = d.report;
  const h = Math.round((new Date(r.due_at).getTime() - Date.now()) / 36e5);
  return (
    <>
      <Link prefetch="intent" to="/admin/signalements" className="inline-flex items-center gap-2 text-sm text-muted hover:text-indigo mb-3"><ArrowLeft className="size-4" />Signalements</Link>
      <div className="flex flex-wrap items-center gap-2 mb-5 animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-indigo mr-2">Signalement {r.ref}</h1>
        {r.status === 'open' && <span className="chip bg-red-50 text-red-700"><Clock className="size-3" />{h > 0 ? `Délai : ${h} h restantes` : 'Délai dépassé'}</span>}
        <span className="chip bg-indigo-50 text-indigo"><Wallet className="size-3" />Paiement direct : pas de fonds détenus</span>
      </div>
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      {a?.ok && <div className="mb-4"><Alert tone="success">{a.ok}</Alert></div>}
      <div className="grid xl:grid-cols-[1.3fr_1fr] gap-6">
        <div className="space-y-4">
          <div className="card p-5"><p className="text-xs text-muted">{REPORT_REASON[r.reason]} · {dateFr(r.created_at)}</p><p className="mt-1">{r.details || 'Aucun détail.'}</p></div>
          <Party title="Signalé par" p={d.reporter} messages={d.messages} party="reporter" evidence={d.evidence.filter((e: any) => e.by_reporter)} />
          <Party title="Concerné" p={d.reported} messages={d.messages} party="reported" evidence={d.evidence.filter((e: any) => !e.by_reporter)} />
          {d.target && (
            <div className="card p-5 text-sm">
              <p className="font-semibold flex items-center gap-2"><FileText className="size-4" />{r.target_type === 'listing' ? 'Annonce' : 'Commande'} Concernée</p>
              {r.target_type === 'listing' ? (
                <><Link prefetch="intent" to={`/a/${d.target.id}`} className="text-indigo underline">{d.target.title}</Link> · {fcfa(d.target.price_fcfa)}<p className="text-muted mt-1 line-clamp-3">{d.target.description}</p>
                  {d.target.photos && <div className="flex gap-2 mt-2">{d.target.photos.slice(0, 4).map((p: string) => <img key={p} src={p} alt="" className="size-16 rounded-lg object-cover" />)}</div>}</>
              ) : (
                <p>{d.target.ref} · {d.target.title_snapshot} · {fcfa(d.target.total_fcfa)} · {PAY[d.target.pay_method]}{d.target.conversation_id && <span className="text-muted"> · fil SM-Chat joint au dossier</span>}</p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="card p-5">
            <p className="font-display font-semibold text-indigo mb-3">Chronologie</p>
            <ol className="space-y-3 text-sm">
              {d.timeline.map((t: any, i: number) => (
                <li key={i} className="flex gap-3" data-reveal="left" style={{ '--d': `${i * 80}ms` } as React.CSSProperties}><span className="size-6 rounded-full bg-turquoise text-white flex items-center justify-center shrink-0"><Check className="size-3.5" /></span><span>{t.body}<span className="block text-xs text-muted">{dateFr(t.created_at)} {timeFr(t.created_at)}</span></span></li>
              ))}
              <li className="flex gap-3"><span className="size-6 rounded-full bg-orange text-white flex items-center justify-center shrink-0"><Flag className="size-3.5" /></span><span>Signalement {r.reporter_id ? 'par le membre' : 'automatique SM-IA'}<span className="block text-xs text-muted">{dateFr(r.created_at)} {timeFr(r.created_at)}</span></span></li>
              <li className="flex gap-3"><span className="size-6 rounded-full bg-sable-dark text-muted flex items-center justify-center shrink-0 text-xs font-bold">{d.timeline.length + 2}</span><span>Décision motivée, notifiée aux deux parties</span></li>
            </ol>
          </div>
          {r.status === 'open' ? (
            <>
              <Form method="post" className="card p-5 space-y-3">
                <input type="hidden" name="intent" value="ask" />
                <p className="font-semibold text-sm flex items-center gap-2"><MessageCircle className="size-4" />Demander Une Précision</p>
                <Select name="to" size="sm" defaultValue="reporter" aria-label="Destinataire" options={[{ value: 'reporter', label: 'Au membre qui signale' }, ...(r.reported_user_id ? [{ value: 'reported', label: 'Au membre concerné' }] : [])]} />
                <textarea name="body" rows={2} required minLength={3} className="input h-auto py-2" placeholder="Votre question" />
                <button className="btn-ghost btn-sm" disabled={busy}><Send className="size-3.5" />Envoyer</button>
              </Form>
              <Form method="post" className="card p-5 space-y-3">
                <p className="font-display font-semibold text-indigo">Décision</p>
                {DEC.filter(([k]) => k !== 'remove' || r.target_type === 'listing').filter(([k]) => k !== 'suspend' || r.reported_user_id).map(([k, t, s]) => (
                  <label key={k} className="flex gap-3 rounded-xl border-2 border-sable-dark p-3 cursor-pointer has-[:checked]:border-indigo has-[:checked]:bg-indigo-50 transition">
                    <input type="radio" name="decision" value={k} checked={dec === k} onChange={() => setDec(k)} className="accent-indigo mt-1" /><span><b className="text-sm">{t}</b><span className="block text-xs text-muted">{s}</span></span>
                  </label>
                ))}
                <textarea name="note" rows={3} required minLength={3} className="input h-auto py-2" placeholder="Motif, envoyé aux deux parties" />
                <button className="btn-primary w-full press" disabled={busy}><Send className="size-4" />Valider Et Notifier</button>
              </Form>
            </>
          ) : <Alert tone="success">Décision : {r.decision}. {r.decision_note}</Alert>}
        </div>
      </div>
    </>
  );
}
