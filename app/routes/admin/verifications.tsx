// File de vérification : décision humaine, images supprimées après décision
import { Form, useLoaderData, useNavigation, useSearchParams, Link } from 'react-router';
import { useState } from 'react';
import { Sparkles, Lock, Check, X, RefreshCw, TriangleAlert, IdCard, ScanFace } from 'lucide-react';
import { api, apiOrThrow } from '~/lib/api.server';
import { dateFr, timeFr } from '~/lib/format';
import { Empty, Seg } from '~/components/ui';

export const handle = { title: 'Vérifications D’Identité' };
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

const wait = (d: string) => { const m = Math.round((Date.now() - new Date(d).getTime()) / 6e4); return m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${Math.floor(m / 1440)} j`; };
const ini = (v: any) => `${v.first_name[0]}${v.last_name[0]}`.toUpperCase();

export default function Verifications() {
  const { items, st } = useLoaderData<typeof loader>();
  const [sp] = useSearchParams();
  const v = items.find((x: any) => x.id === sp.get('id')) || items[0];
  return (
    <div className="grid lg:grid-cols-[250px_1fr] xl:grid-cols-[250px_1fr_300px] gap-4 items-start">
      <aside className="card p-3 lg:sticky lg:top-24">
        <div className="flex items-center justify-between px-2 pt-1 pb-2"><h2 className="font-display font-semibold text-ink">File D’Attente</h2>{st === 'pending' && <span className="chip bg-orange-50 text-orange-dark">{items.length}</span>}</div>
        <Seg className="w-full mb-2 [&>*]:flex-1 [&>*]:px-1.5 [&>*]:text-xs" items={[['pending', 'En Attente'], ['approved', 'Validées'], ['rejected', 'Refusées']].map(([k, l]) => ({ label: l, to: `?statut=${k}`, on: st === k }))} />
        <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
          {items.map((x: any) => (
            <li key={x.id}><Link prefetch="intent" to={`?statut=${st}&id=${x.id}`} replace preventScrollReset
              className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-colors ${x.id === v?.id ? 'bg-orange-50/70 ring-1 ring-orange/25' : 'hover:bg-sable'}`}>
              <span className="size-8 rounded-full bg-sable-2 text-indigo text-[11px] font-bold flex items-center justify-center shrink-0">{ini(x)}</span>
              <span className="flex-1 min-w-0"><b className="block text-[13px] truncate">{x.first_name} {x.last_name[0]}.</b><span className="block text-[11px] text-muted truncate">{x.quarter || 'Dakar'}</span></span>
              <span className="text-[11px] text-muted whitespace-nowrap">{wait(x.submitted_at)}</span>
            </Link></li>
          ))}
          {!items.length && <li className="text-sm text-muted p-4 text-center">Aucun dossier.</li>}
        </ul>
      </aside>
      {v ? <Dossier key={v.id} v={v} /> : <div className="xl:col-span-2"><Empty title="Aucun Dossier" text="La file est vide." /></div>}
    </div>
  );
}

function Dossier({ v }: { v: any }) {
  const [mode, setMode] = useState<null | 'reject' | 'resubmit'>(null);
  const busy = useNavigation().state === 'submitting';
  const p = v.ai_precheck || {};
  const checks: [string, any, boolean | null][] = [
    ['Pièce lisible et exploitable', p.document_lisible == null ? 'Non évalué' : p.document_lisible ? 'Oui' : 'À revoir', p.document_lisible ?? null],
    ['Selfie : un seul visage net', p.selfie_un_seul_visage == null ? 'Non évalué' : p.selfie_un_seul_visage ? 'Oui' : 'À revoir', p.selfie_un_seul_visage ?? null],
    ['Numéro confirmé par SMS', v.phone_verified ? 'Oui' : 'Non', !!v.phone_verified],
    ['Type de pièce détecté', p.type_document || DOC[v.doc_type], true],
  ];
  return (
    <>
      <div className="card p-5 space-y-4 animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><p className="font-display font-semibold text-lg text-ink">{v.first_name} {v.last_name[0]}.</p>
            <p className="text-xs text-muted">Dossier VER-{v.id.slice(0, 4).toUpperCase()}, {DOC[v.doc_type]}, envoyé le {dateFr(v.submitted_at)} à {timeFr(v.submitted_at)}</p></div>
          {v.status === 'pending' ? <span className="chip bg-orange-50 text-orange-dark"><Lock className="size-3" />Inscription Bloquée Jusqu’à Décision</span>
            : <span className={`chip ${v.status === 'approved' ? 'bg-turquoise-50 text-turquoise' : 'bg-red-50 text-red-700'}`}>{v.status === 'approved' ? 'Validé' : 'Refusé'} le {dateFr(v.decided_at)}</span>}
        </div>
        {v.has_files ? (
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            {['document', 'selfie'].map((k) => (
              <figure key={k}><img src={`/kyc/${v.id}/${k}`} alt={k === 'document' ? 'Pièce d’identité' : 'Selfie en direct'} className="w-full aspect-[4/3] object-cover rounded-xl bg-sable-2" loading="lazy" decoding="async" />
                <figcaption className="text-xs text-muted mt-1 flex items-center gap-1">{k === 'document' ? <IdCard className="size-3.5" /> : <ScanFace className="size-3.5" />}{k === 'document' ? 'Pièce d’identité' : 'Selfie en direct'}, affichage journalisé</figcaption></figure>
            ))}
          </div>
        ) : <p className="rounded-xl bg-sable p-4 text-sm text-muted">Images supprimées après la décision (minimisation des données).</p>}
        <p className="rounded-xl bg-indigo-50 text-indigo text-[12.5px] p-3.5 flex gap-2.5"><Lock className="size-4 shrink-0 mt-0.5" />Accès réservé aux modérateurs habilités, chaque affichage est inscrit au journal d’audit. Images supprimées dès la décision (loi n° 2008-12) [durée de conservation à confirmer].</p>
      </div>
      <div className="space-y-4 lg:col-span-2 xl:col-span-1">
        <div className="card p-5" data-reveal="">
          <h3 className="font-display font-semibold text-ink mb-2">Contrôles Automatiques</h3>
          <ul className="divide-y divide-line text-[13px]">
            {checks.map(([l, val, ok]) => (
              <li key={l} className="flex items-center gap-2 py-2.5">{ok === false ? <TriangleAlert className="size-4 text-[#B7791F]" /> : <Check className="size-4 text-turquoise" />}<span className="flex-1 text-ink-2">{l}</span>
                <b className={ok === false ? 'text-[#B7791F]' : ok == null ? 'text-muted' : 'text-turquoise'}>{val}</b></li>
            ))}
          </ul>
          {p.problemes?.length > 0 && <p className="text-[11.5px] text-muted mt-2 flex gap-1.5"><Sparkles className="size-3.5 shrink-0 mt-0.5" />Points relevés par le pré-contrôle : {p.problemes.join(', ')}.</p>}
        </div>
        {v.status === 'pending' && (
          <Form method="post" className="card p-5 space-y-2.5" data-reveal="">
            <h3 className="font-display font-semibold text-ink mb-1">Décision</h3>
            <input type="hidden" name="id" value={v.id} />
            <button name="decision" value="approved" className="btn w-full bg-turquoise text-white hover:bg-turquoise/90 press" disabled={busy}><Check className="size-4" />Valider Le Compte</button>
            {mode ? (
              <div className="space-y-2 animate-slide-down">
                <input name="reason" required autoFocus defaultValue={mode === 'resubmit' ? 'Nouveau document demandé : ' : ''} placeholder="Motif (ex. photo illisible)" className="input" />
                <button name="decision" value="rejected" className="btn w-full bg-red-700 text-white press" disabled={busy}>{mode === 'resubmit' ? 'Envoyer La Demande' : 'Confirmer Le Refus'}</button>
                <button type="button" onClick={() => setMode(null)} className="text-xs text-muted w-full">Annuler</button>
              </div>
            ) : (
              <>
                <button type="button" onClick={() => setMode('resubmit')} className="btn-ghost w-full"><RefreshCw className="size-4" />Demander Un Nouveau Document</button>
                <button type="button" onClick={() => setMode('reject')} className="btn w-full border border-red-200 bg-white text-red-700 hover:bg-red-50"><X className="size-4" />Refuser Avec Motif</button>
              </>
            )}
            <p className="text-[11.5px] text-muted pt-1">La décision est humaine. Les contrôles automatiques ne sont qu’un avis.</p>
          </Form>
        )}
      </div>
    </>
  );
}
