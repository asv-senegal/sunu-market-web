// P33 : traitement d'un signalement (deux versions, preuves, chronologie, décision motivée)
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';
import { useState } from 'react';
import { ArrowLeft, Clock, Wallet, MessageCircle, Send, Check, Flag, FileText } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { REPORT_REASON, fcfa, dateFr, timeFr, PAY } from '~/lib/format';
import { Alert } from '~/components/ui';
import { Select } from '~/components/Select';

export const handle = { title: (d: any) => `Signalement ${d?.report?.ref || ''}` };
export const loader = ({ request, params }: any) => apiOrThrow(request, `/admin/reports/${params.id}`);
export async function action({ request, params }: any) {
  const f = await request.formData();
  if (f.get('intent') === 'ask') { const r = await api(request, `/admin/reports/${params.id}/messages`, { json: { to: f.get('to'), body: f.get('body') } }); return r.ok ? { ok: 'Demande envoyée.' } : formError(r); }
  const r = await api(request, `/admin/reports/${params.id}/decision`, { json: { decision: f.get('decision'), note: f.get('note') } });
  return r.ok ? redirect('/admin/signalements') : formError(r);
}
const DEC = [['dismiss', 'Classer', 'Signalement non fondé'], ['warn', 'Avertir Le Commerçant', 'Et demander une solution amiable'], ['remove', 'Retirer L’Annonce', 'Annonce non conforme'], ['suspend', 'Suspendre Le Compte', 'Récidive ou fraude']];

function Party({ title, p, messages, party, evidence, lead }: any) {
  return (
    <div className="card p-5 space-y-3 animate-fade-up">
      <div className="flex items-center gap-3">
        <span className="size-10 rounded-full bg-indigo text-white flex items-center justify-center font-semibold">{p?.name?.split(' ').map((x: string) => x[0]).join('').slice(0, 2) || 'IA'}</span>
        <div><p className="font-semibold text-sm">{title} : {p?.name || 'SM-IA (signalement automatique)'}</p>
          {p && <p className="text-xs text-muted">{p.verification_status === 'verified' ? 'Compte vérifié' : 'Non vérifié'}, {p.purchases} achats, {p.sales} ventes{p.rating ? `, ${p.rating} sur 5` : ''}, {p.reports_against} signalement(s) reçu(s)</p>}</div>
      </div>
      {lead}
      {messages.filter((m: any) => m.party === party).map((m: any, i: number) => <p key={i} className="text-sm rounded-xl bg-sable p-3">« {m.body} » <span className="text-xs text-muted block">{dateFr(m.created_at)} {timeFr(m.created_at)}</span></p>)}
      {evidence.length > 0 && <div className="flex gap-2 flex-wrap">{evidence.map((e: any) => <a key={e.id} href={`/preuve/${e.id}`} target="_blank" rel="noreferrer"><img src={`/preuve/${e.id}`} alt="Preuve" className="size-20 rounded-xl object-cover hover:scale-105 transition-transform" loading="lazy" decoding="async" /></a>)}</div>}
    </div>
  );
}

export default function Report() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const [dec, setDec] = useState('warn');
  const [ask, setAsk] = useState(false);
  const r = d.report;
  const h = Math.round((new Date(r.due_at).getTime() - Date.now()) / 36e5);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-5 animate-fade-up">
        <Link prefetch="intent" to="/admin/signalements" className="size-8 rounded-full bg-white border border-line flex items-center justify-center hover:bg-sable mr-1" aria-label="Retour aux signalements"><ArrowLeft className="size-4" /></Link>
        {r.status === 'open' && <span className="chip bg-red-50 text-red-700"><Clock className="size-3" />{h > 0 ? `Délai : ${h} h restantes` : 'Délai dépassé'}</span>}
        <span className="chip bg-indigo-50 text-indigo"><Wallet className="size-3" />Paiement direct : pas de fonds détenus</span>
        {r.status === 'open' && <button onClick={() => setAsk(!ask)} className="btn-ghost btn-sm ml-auto" aria-expanded={ask}><MessageCircle className="size-3.5" />Demander Une Précision</button>}
      </div>
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      {a?.ok && <div className="mb-4"><Alert tone="success">{a.ok}</Alert></div>}
      {ask && r.status === 'open' && (
        <Form method="post" className="card p-5 mb-4 grid md:grid-cols-[220px_1fr_auto] gap-3 items-start animate-slide-down">
          <input type="hidden" name="intent" value="ask" />
          <Select name="to" size="sm" defaultValue="reporter" aria-label="Destinataire" options={[{ value: 'reporter', label: 'Au membre qui signale' }, ...(r.reported_user_id ? [{ value: 'reported', label: 'Au membre concerné' }] : [])]} />
          <textarea name="body" rows={2} required minLength={3} className="input h-auto py-2" placeholder="Votre question, visible par ce membre seulement" />
          <button className="btn-indigo btn-sm" disabled={busy}><Send className="size-3.5" />Envoyer</button>
        </Form>
      )}
      <div className="grid lg:grid-cols-2 xl:grid-cols-[1fr_1fr_0.9fr] gap-4">
        <Party title="Signalé par" p={d.reporter} messages={d.messages} party="reporter" evidence={d.evidence.filter((e: any) => e.by_reporter)}
          lead={<p className="text-sm rounded-xl border border-line p-3">{d.report.details ? `« ${d.report.details} »` : 'Aucun détail.'}<span className="block text-[11px] text-muted mt-1">{REPORT_REASON[r.reason]} · {dateFr(r.created_at)}</span></p>} />
        <Party title="Concerné" p={d.reported} messages={d.messages} party="reported" evidence={d.evidence.filter((e: any) => !e.by_reporter)}
          lead={d.target && (
            <div className="rounded-xl bg-indigo-50 text-indigo text-[12.5px] p-3 flex gap-2"><FileText className="size-4 shrink-0 mt-0.5" />
              {r.target_type === 'listing'
                ? <span>Annonce : <Link prefetch="intent" to={`/a/${d.target.id}`} className="underline">{d.target.title}</Link>, {fcfa(d.target.price_fcfa)}. Version archivée au moment du signalement.</span>
                : <span>Commande {d.target.ref} : {d.target.title_snapshot}, {fcfa(d.target.total_fcfa)}, {PAY[d.target.pay_method]}{d.target.conversation_id ? '. Fil SM-Chat joint au dossier.' : '.'}</span>}
            </div>
          )} />
        <div className="card p-5 lg:col-span-2 xl:col-span-1" data-reveal="">
          <p className="font-display font-semibold text-ink mb-3">Chronologie</p>
          <ol className="space-y-3.5 text-[13px]">
            {d.timeline.map((t: any, i: number) => (
              <li key={i} className="flex gap-3"><span className="size-6 rounded-full bg-turquoise text-white flex items-center justify-center shrink-0"><Check className="size-3.5" /></span><span className="font-medium">{t.body}<span className="block text-[11.5px] text-muted font-normal">{dateFr(t.created_at)} {timeFr(t.created_at)}</span></span></li>
            ))}
            <li className="flex gap-3"><span className="size-6 rounded-full bg-orange text-white flex items-center justify-center shrink-0 ring-4 ring-orange-50"><Flag className="size-3.5" /></span><span className="font-medium">Signalement {r.reporter_id ? 'par le membre' : 'automatique SM-IA'}<span className="block text-[11.5px] text-muted font-normal">{dateFr(r.created_at)} {timeFr(r.created_at)}</span></span></li>
            <li className="flex gap-3"><span className="size-6 rounded-full border-2 border-line text-muted flex items-center justify-center shrink-0 text-[11px] font-bold">{d.timeline.length + 2}</span><span className="text-muted">Décision motivée<span className="block text-[11.5px]">Notifiée aux deux parties</span></span></li>
          </ol>
        </div>
      </div>
      {r.status === 'open' ? (
        <Form method="post" className="card p-5 mt-4" data-reveal="">
          <p className="font-display font-semibold text-ink mb-3">Décision</p>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {DEC.filter(([k]) => k !== 'remove' || r.target_type === 'listing').filter(([k]) => k !== 'suspend' || r.reported_user_id).map(([k, t, sub]) => (
              <label key={k} className={`flex gap-3 rounded-xl p-3.5 cursor-pointer transition border ${dec === k ? 'border-2 border-orange bg-orange-50/30' : 'border-line hover:border-orange/40'}`}>
                <input type="radio" name="decision" value={k} checked={dec === k} onChange={() => setDec(k)} className="accent-orange mt-1" /><span><b className="text-sm">{t}</b><span className="block text-xs text-muted">{sub}</span></span>
              </label>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <input name="note" required minLength={3} className="input flex-1" placeholder="Motif : envoyé aux deux parties et inscrit au journal d’audit" />
            <button className="btn-primary press whitespace-nowrap" disabled={busy}><Send className="size-4" />Valider Et Notifier</button>
          </div>
        </Form>
      ) : <div className="mt-4"><Alert tone="success">Décision : {r.decision}. {r.decision_note}</Alert></div>}
    </>
  );
}
