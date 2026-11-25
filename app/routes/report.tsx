// P17 : Signaler un problème (annonce, membre ou commande). Sunu-Market ne rembourse pas : un modérateur examine chaque signalement.
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { ArrowLeft, Camera, Flag, Users, Wallet, BadgeCheck, X } from 'lucide-react';
import { api, requireMe, formError } from '~/lib/api.server';
import { fcfa, img } from '~/lib/format';
import { Alert } from '~/components/ui';

export const meta = () => [{ title: 'Signaler Un Problème | Sunu-Market' }];
export async function loader({ request }: any) {
  await requireMe(request);
  const sp = new URL(request.url).searchParams;
  const type = sp.get('type') || 'listing'; const id = sp.get('id') || '';
  // Résumé de l'objet signalé (colonne de droite)
  let target: any = null;
  if (id && type === 'order') { const r = await api(request, `/orders/${id}`); if (r.ok) target = { title: r.data.order.title_snapshot, price: r.data.order.total_fcfa, photo: r.data.order.photo, who: r.data.role === 'buyer' ? r.data.order.shop_name : r.data.order.buyer_name, ref: r.data.order.ref }; }
  if (id && type === 'listing') { const r = await api(request, `/listings/${id}`); if (r.ok) { const l = r.data.listing || r.data; target = { title: l.title, price: l.price_fcfa, photo: l.photos?.[0]?.url || l.photo, who: l.shop_name }; } }
  return { type, target };
}
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/reports', { json: { targetType: f.get('type'), targetId: f.get('id'), reason: f.get('reason'), details: f.get('details') || undefined } });
  if (!r.ok) return formError(r);
  // Preuves jointes au signalement (photos, captures SM-Chat), visibles par l'équipe seulement
  const files = (f.getAll('files') as File[]).filter((x) => x && x.size > 0).slice(0, 4);
  let warn = '';
  if (files.length) {
    const fd = new FormData(); files.forEach((x) => fd.append('files', x));
    const e = await api(request, `/reports/${r.data.report.id}/evidence`, { form: fd });
    if (!e.ok) warn = e.data?.error || 'Les preuves n’ont pas pu être envoyées ; ajoutez-les depuis le signalement.';
  }
  return { done: r.data.report.ref, id: r.data.report.id, warn };
}
const REASONS: [string, string, string[]][] = [
  ['not_as_described', 'Article non conforme à l’annonce', ['order', 'listing']], ['not_received', 'Commerçant absent au rendez-vous', ['order']],
  ['behaviour', 'Comportement inapproprié', ['order', 'user', 'listing']], ['scam', 'Annonce frauduleuse', ['listing', 'order', 'user']],
  ['prohibited', 'Article interdit', ['listing']], ['other', 'Autre motif', ['order', 'listing', 'user']],
];

export default function Report() {
  const { type, target } = useLoaderData<typeof loader>();
  const [sp] = useSearchParams();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const nav = useNavigate();
  const reasons = REASONS.filter(([, , t]) => t.includes(type));
  const [reason, setReason] = useState(reasons[0][0]);
  const [previews, setPreviews] = useState<string[]>([]);
  if (a?.done) return (
    <div className="card p-8 max-w-xl animate-fade-up">
      <Flag className="size-8 text-orange" />
      <h1 className="font-display text-xl font-semibold mt-3">Signalement {a.done} Envoyé</h1>
      <p className="text-sm text-muted mt-1">Un modérateur l’examinera ; vous serez notifié de la décision.</p>
      {a.warn && <div className="mt-3"><Alert>{a.warn}</Alert></div>}
      <Link prefetch="intent" to={`/signalements/${a.id}`} className="btn-primary mt-5">Voir Le Signalement</Link>
    </div>
  );
  return (
    <>
      <div className="flex items-center gap-3 animate-fade-up">
        <button type="button" onClick={() => nav(-1)} className="size-9 rounded-full bg-white border border-line flex items-center justify-center hover:bg-sable" aria-label="Retour"><ArrowLeft className="size-[18px]" /></button>
        <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink">Signaler Un Problème</h1>
      </div>
      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        <Form method="post" encType="multipart/form-data" className="card p-5 md:p-6 space-y-5">
          {a?.error && <Alert>{a.error}</Alert>}
          <input type="hidden" name="type" value={type} /><input type="hidden" name="id" value={sp.get('id') || ''} />
          <fieldset><legend className="label">Motif</legend>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {reasons.map(([k, l]) => (
                <label key={k} className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm cursor-pointer transition-colors ${reason === k ? 'border-orange border-2 bg-orange-50/30' : 'border-line hover:border-orange/40'}`}>
                  <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} className="accent-orange size-4" />{l}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block"><span className="label">Décrivez Le Problème</span><textarea name="details" rows={3} maxLength={2000} required minLength={10} className="input h-auto py-2.5" placeholder="Ce qui s’est passé, quand, ce qui était convenu." /></label>
          <div>
            <span className="label">Preuves (photos, captures SM-Chat)</span>
            <div className="flex flex-wrap gap-2.5">
              {previews.map((u, i) => <img key={i} src={u} alt="" className="size-[72px] rounded-xl object-cover" />)}
              <label className="size-[72px] rounded-xl border-2 border-dashed border-line flex items-center justify-center text-muted cursor-pointer hover:border-turquoise hover:text-turquoise" title="Ajouter des photos (4 maximum)">
                <Camera className="size-5" />
                <input type="file" name="files" accept="image/jpeg,image/png,image/webp" multiple className="sr-only"
                  onChange={(e) => setPreviews(Array.from(e.target.files || []).slice(0, 4).map((f) => URL.createObjectURL(f)))} />
              </label>
              {previews.length > 0 && <button type="button" className="text-xs text-muted self-center flex items-center gap-1" onClick={(e) => { setPreviews([]); const i = (e.currentTarget.previousSibling as HTMLElement).querySelector('input') as HTMLInputElement; if (i) i.value = ''; }}><X className="size-3" />Retirer</button>}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary press" disabled={busy}><Flag className="size-4" />{busy ? 'Envoi…' : 'Envoyer Le Signalement'}</button>
            <button type="button" onClick={() => nav(-1)} className="btn-ghost">Annuler</button>
          </div>
        </Form>
        <aside className="space-y-3">
          {target && (
            <div className="card p-4 flex gap-3 items-center">
              <img src={img(target.photo)} alt="" className="size-14 rounded-xl object-cover bg-sable-2" />
              <div className="min-w-0 flex-1"><p className="font-semibold text-[13px] line-clamp-2">{target.title}</p>
                {target.who && <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><BadgeCheck className="size-3.5 text-turquoise" />{target.who}</p>}</div>
              {target.price != null && <p className="font-semibold text-sm whitespace-nowrap">{fcfa(target.price)}</p>}
            </div>
          )}
          <div className="rounded-2xl bg-indigo-50 text-indigo p-4 text-[12.5px] flex gap-2.5"><Users className="size-4 shrink-0 mt-0.5" /><p><b>Une personne de l’équipe examine</b> le signalement, délai visé 72 heures [à confirmer]. Elle peut retirer l’annonce, avertir ou suspendre le compte.</p></div>
          <div className="rounded-2xl bg-orange-50 text-orange-dark p-4 text-[12.5px] flex gap-2.5"><Wallet className="size-4 shrink-0 mt-0.5" /><p>Le paiement étant direct entre membres, Sunu-Market ne rembourse pas. Gardez vos preuves et privilégiez le paiement à la remise.</p></div>
        </aside>
      </div>
    </>
  );
}
