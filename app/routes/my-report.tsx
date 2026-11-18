// Signalement côté membre : donner sa version, ajouter des preuves, lire la décision
import { Form, useActionData, useLoaderData, useNavigation, Link } from 'react-router';
import { ArrowLeft, Camera, ShieldCheck } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { REPORT_REASON, dateFr, timeFr } from '~/lib/format';
import { Alert } from '~/components/ui';

export const meta = () => [{ title: 'Signalement | Sunu-Market' }];
export const loader = ({ request, params }: any) => apiOrThrow(request, `/reports/${params.id}`);
export async function action({ request, params }: any) {
  const form = await request.formData();
  if (form.get('intent') === 'evidence') {
    const clean = new FormData();
    for (const f of form.getAll('files')) if (typeof f === 'object' && (f as File).size) clean.append('files', f);
    const r = await api(request, `/reports/${params.id}/evidence`, { form: clean });
    return r.ok ? { ok: 'Preuves ajoutées.' } : formError(r);
  }
  const r = await api(request, `/reports/${params.id}/messages`, { json: { body: form.get('body') } });
  return r.ok ? { ok: 'Votre message a été transmis à l’équipe.' } : formError(r);
}
const DEC: Record<string, string> = { dismiss: 'Classé', warn: 'Avertissement', remove: 'Annonce retirée', suspend: 'Compte suspendu' };

export default function MyReport() {
  const { report: r, messages, evidence } = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  return (
    <div className="container-x py-6 max-w-2xl space-y-4">
      <Link prefetch="intent" to="/signalements" className="inline-flex items-center gap-2 text-sm text-muted hover:text-indigo"><ArrowLeft className="size-4" />Mes Signalements</Link>
      <div className="card p-6 animate-fade-up">
        <p className="text-xs text-muted">{r.ref} · {dateFr(r.created_at)}</p>
        <h1 className="font-display text-xl font-bold text-indigo mt-1">{REPORT_REASON[r.reason]}</h1>
        <p className="text-sm mt-1">{r.party === 'reporter' ? 'Vous avez fait ce signalement.' : 'Ce signalement vous concerne. Donnez votre version : un modérateur examinera les deux parties.'}</p>
        {r.details && <p className="text-sm text-muted mt-2">« {r.details} »</p>}
        {r.status === 'closed' && <div className="mt-4"><Alert tone="success"><b>Décision : {DEC[r.decision]}.</b> {r.decision_note}</Alert></div>}
      </div>
      {a?.ok && <Alert tone="success">{a.ok}</Alert>}
      {a?.error && <Alert>{a.error}</Alert>}
      {messages.length > 0 && (
        <div className="card p-5 space-y-3">
          {messages.map((m: any, i: number) => (
            <div key={i} className={`rounded-xl p-3 text-sm animate-pop ${m.party === 'staff' ? 'bg-indigo-50' : 'bg-sable'}`}>
              <p className="text-xs font-semibold text-indigo">{m.party === 'staff' ? 'Équipe Sunu-Market' : 'Vous'} · {dateFr(m.created_at)} {timeFr(m.created_at)}</p><p>{m.body}</p>
            </div>
          ))}
        </div>
      )}
      {r.status === 'open' && (
        <>
          <Form method="post" className="card p-5 space-y-3">
            <label className="block"><span className="label">{r.party === 'reporter' ? 'Ajouter Une Précision' : 'Votre Version Des Faits'}</span><textarea name="body" rows={4} required minLength={2} maxLength={2000} className="input h-auto py-2" /></label>
            <button className="btn-primary press" disabled={busy}>Envoyer</button>
          </Form>
          <Form method="post" encType="multipart/form-data" className="card p-5 space-y-3">
            <input type="hidden" name="intent" value="evidence" />
            <label className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-sable-dark p-4 cursor-pointer hover:border-turquoise">
              <Camera className="size-6 text-indigo" /><span className="text-sm"><b className="text-indigo block">Ajouter Des Photos (4 Maximum)</b><span className="text-xs text-muted">{evidence} photo(s) déjà envoyée(s)</span></span>
              <input type="file" name="files" accept="image/jpeg,image/png,image/webp" multiple required className="sr-only" />
            </label>
            <p className="text-xs text-muted flex gap-2"><ShieldCheck className="size-4 text-turquoise shrink-0" />Visibles uniquement par l’équipe de modération.</p>
            <button className="btn-ghost press" disabled={busy}>Envoyer Les Photos</button>
          </Form>
        </>
      )}
    </div>
  );
}
