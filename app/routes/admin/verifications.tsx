// File de vérification : décision humaine, images supprimées après décision
import { Form, useLoaderData, useNavigation, useSearchParams, Link } from 'react-router';
import { useState } from 'react';
import { ShieldCheck, Sparkles, Phone } from 'lucide-react';
import { api, apiOrThrow } from '~/lib/api.server';
import { dateFr, timeFr } from '~/lib/format';
import { Empty, PageTitle } from '~/components/ui';

export async function loader({ request }: any) {
  const st = new URL(request.url).searchParams.get('statut') || 'pending';
  return { ...(await apiOrThrow(request, `/admin/verifications?status=${st}`)), st };
}
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, `/admin/verifications/${f.get('id')}/decision`, { json: { decision: f.get('decision'), reason: f.get('reason') || undefined } });
  return r.ok ? null : { error: r.data.error };
}
const DOC: Record<string, string> = { cni: 'Carte D’Identité', passport: 'Passeport', residence: 'Carte De Séjour' };

export default function Verifications() {
  const { items, st } = useLoaderData<typeof loader>();
  return (
    <>
      <PageTitle title="Vérifications" sub="L’inscription reste bloquée jusqu’à votre décision. Les images sont supprimées dès la décision (loi n° 2008-12).">
        <div className="flex gap-1">{[['pending', 'En Attente'], ['approved', 'Validées'], ['rejected', 'Refusées']].map(([k, l]) => <Link prefetch="intent" key={k} to={`?statut=${k}`} className={`btn-sm btn ${st === k ? 'bg-indigo text-white' : 'btn-ghost'}`}>{l}</Link>)}</div>
      </PageTitle>
      {items.length ? <div className="space-y-4">{items.map((v: any) => <Item key={v.id} v={v} />)}</div> : <Empty title="Aucun Dossier" />}
    </>
  );
}

function Item({ v }: { v: any }) {
  const [reject, setReject] = useState(false);
  const busy = useNavigation().state === 'submitting';
  return (
    <div className="card p-5 animate-fade-up">
      <div className="flex flex-wrap justify-between gap-2">
        <div><p className="font-semibold">{v.first_name} {v.last_name}</p><p className="text-xs text-muted">{v.phone} · {v.quarter || '—'} · {DOC[v.doc_type]} · envoyé le {dateFr(v.submitted_at)} à {timeFr(v.submitted_at)}</p>
          {v.phone_verified && <p className="text-xs text-turquoise flex items-center gap-1 mt-0.5"><Phone className="size-3" />Numéro confirmé par SMS</p>}</div>
        {v.status !== 'pending' && <span className="text-xs text-muted">Décision le {dateFr(v.decided_at)}{v.reason ? ` : ${v.reason}` : ''}</span>}
      </div>
      {v.has_files && (
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-xl">
          {['document', 'selfie'].map((k) => (
            <figure key={k}><img src={`/kyc/${v.id}/${k}`} alt={k === 'document' ? 'Pièce d’identité' : 'Selfie'} className="w-full aspect-[4/3] object-cover rounded-xl bg-sable-dark" /><figcaption className="text-xs text-muted mt-1">{k === 'document' ? 'Pièce D’Identité' : 'Selfie'}</figcaption></figure>
          ))}
        </div>
      )}
      {v.ai_precheck && (
        <div className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs text-indigo max-w-xl animate-fade-up">
          <p className="font-semibold flex items-center gap-1"><Sparkles className="size-3.5" />Pré-Contrôle SM-IA (Avis Seulement, Aucune Comparaison De Visage)</p>
          <p>Pièce : {v.ai_precheck.document_lisible ? 'lisible' : 'à revoir'}{v.ai_precheck.type_document ? ` (${v.ai_precheck.type_document})` : ''} · Selfie : {v.ai_precheck.selfie_un_seul_visage ? 'un seul visage net' : 'à revoir'}</p>
          {v.ai_precheck.problemes?.length > 0 && <p>Points : {v.ai_precheck.problemes.join(', ')}</p>}
        </div>
      )}
      {v.status === 'pending' && (
        <Form method="post" className="mt-4 flex flex-wrap gap-2 items-center">
          <input type="hidden" name="id" value={v.id} />
          <button name="decision" value="approved" className="btn-primary btn-sm" disabled={busy}><ShieldCheck className="size-4" />Valider</button>
          {!reject ? <button type="button" onClick={() => setReject(true)} className="btn-ghost btn-sm">Refuser</button> : (
            <>
              <input name="reason" required placeholder="Motif du refus (ex. photo illisible)" className="input h-9 max-w-xs" />
              <button name="decision" value="rejected" className="btn-sm btn bg-red-700 text-white" disabled={busy}>Confirmer Le Refus</button>
            </>
          )}
        </Form>
      )}
    </div>
  );
}
