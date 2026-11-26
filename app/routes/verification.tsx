// Étapes 2 et 3 : vérification d'identité obligatoire (pas de « Plus tard »)
import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from 'react-router';
import { useState } from 'react';
import { IdCard, Camera, Clock, BadgeCheck, ShieldCheck, XCircle, Lock, Gift, ScanFace } from 'lucide-react';
import { api, requireMe, formError } from '~/lib/api.server';
import { Alert } from '~/components/ui';
import { AuthFrame } from './_auth';
import { dateFr } from '~/lib/format';
import { Select } from '~/components/Select';

export const meta = () => [{ title: 'Vérification | Sunu-Market' }];

export async function loader({ request }: any) {
  const me = await requireMe(request, { verified: false });
  const v = await api(request, '/me/verification');
  return { me, v: v.data };
}

export async function action({ request }: any) {
  const form = await request.formData();
  const r = await api(request, '/me/verification', { form });
  if (!r.ok) return formError(r);
  return redirect('/verification');
}

export default function Verification() {
  const { me, v } = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const [doc, setDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const status = v.status;

  if (status === 'verified') {
    return (
      <AuthFrame step={3} title="Compte Vérifié" image="baskets_stack" caption="Bienvenue dans le centre commercial de Dakar.">
        <span className="size-14 rounded-2xl bg-turquoise-50 text-turquoise flex items-center justify-center"><BadgeCheck className="size-7" /></span>
        <p className="mt-4 text-ink-2">Bienvenue {me.user.firstName} ! Vous pouvez acheter, échanger dans SM-Chat et ouvrir votre boutique avec 14 jours d’essai gratuit.</p>
        <div className="flex flex-wrap gap-3 mt-6"><Link prefetch="intent" to="/ma-boutique" className="btn-primary h-12 px-5">Ouvrir Ma Boutique</Link><Link prefetch="intent" to="/" className="btn-ghost h-12 px-5">Découvrir</Link></div>
      </AuthFrame>
    );
  }
  if (status === 'pending') {
    return (
      <AuthFrame step={3} title="Votre Compte Est En Cours De Validation" image="baskets_stack" caption="Pendant ce temps, découvrez les boutiques de Dakar.">
        <span className="size-14 rounded-2xl bg-turquoise-50 text-turquoise flex items-center justify-center -mt-2 mb-4"><Clock className="size-7" /></span>
        <p className="text-sm text-muted">Dossier envoyé le {dateFr(v.last.submitted_at)}. Un modérateur vérifie vos documents ; vous recevez un SMS dès la validation, en général sous 24 heures [à confirmer].</p>
        <div className="mt-5 rounded-2xl bg-[#FDF3D7] p-4 flex gap-3 text-[#8A5A00]"><Gift className="size-5 shrink-0" />
          <div><p className="font-semibold text-sm">14 Jours D’Essai Gratuit</p><p className="text-[12.5px]">Dès la validation. Ensuite, abonnement annuel de 2 500 FCFA pour garder votre boutique active. Acheter reste gratuit.</p></div></div>
        <div className="flex flex-wrap gap-3 mt-6"><Link prefetch="intent" to="/recherche" className="btn-primary h-12 px-5">Explorer Le Catalogue</Link><Link prefetch="intent" to="/pages/abonnement" className="btn-ghost h-12 px-5">Voir L’Abonnement</Link></div>
      </AuthFrame>
    );
  }
  return (
    <AuthFrame step={2} title="Vérification D’Identité Et Faciale" image="tailor_sewing" caption="Une vérification unique pour un marché de confiance.">
      {status === 'rejected' && <div className="mb-4"><Alert><span className="inline-flex items-center gap-1 font-semibold"><XCircle className="size-4" />Dossier refusé</span> : {v.last?.reason}. Vous pouvez en soumettre un nouveau.</Alert></div>}
      <Form method="post" encType="multipart/form-data" className="space-y-4">
        <p className="rounded-xl bg-orange-50 text-orange-dark text-[12.5px] p-3.5 flex gap-2.5"><Lock className="size-4 shrink-0 mt-0.5" /><span><b>Étape obligatoire.</b> Sans pièce d’identité et selfie validés, le compte n’est pas activé.</span></p>
        {a?.error && <Alert>{a.error}</Alert>}
        <label className="block"><span className="label">Type de pièce</span>
          <Select name="docType" defaultValue="cni" options={[{ value: 'cni', label: 'Carte D’Identité CEDEAO' }, { value: 'passport', label: 'Passeport' }, { value: 'residence', label: 'Carte De Séjour' }]} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Tile n={1} icon={IdCard} name="document" label="Pièce D’Identité" hint="Recto lisible, sans reflet" preview={doc} onPick={setDoc} />
          <Tile n={2} icon={ScanFace} name="selfie" label="Selfie En Direct" hint="Visage de face, bien éclairé" preview={selfie} onPick={setSelfie} capture="user" />
        </div>
        <p className="rounded-xl bg-indigo-50 text-indigo text-[12.5px] p-3.5 flex gap-2.5"><ShieldCheck className="size-4 shrink-0 mt-0.5" />Documents consultés uniquement par l’équipe de vérification et jamais montrés aux autres membres. Chaque consultation est journalisée ; les images sont supprimées dès la décision (loi n° 2008-12, CDP).</p>
        <button className="btn-primary w-full h-12 press shadow-[0_8px_20px_-10px_rgb(201_67_16/.8)]" disabled={busy || !doc || !selfie}>
          <Camera className="size-4" />{busy ? 'Envoi…' : !doc ? 'Ajoutez Votre Pièce' : !selfie ? 'Prenez Votre Selfie' : 'Envoyer Pour Vérification'}</button>
      </Form>
    </AuthFrame>
  );
}

function Tile({ n, icon: Icon, name, label, hint, preview, onPick, capture }: any) {
  return (
    <label className={`block cursor-pointer rounded-2xl p-3 border-2 transition-colors ${preview ? 'border-turquoise bg-white' : 'border-dashed border-orange/50 bg-orange-50/30 hover:border-orange'}`}>
      <span className="flex items-start justify-between gap-1"><span className="text-[13px] font-semibold text-ink leading-tight">{n}. {label}</span>
        <span className={`chip text-[10.5px] ${preview ? 'bg-turquoise-50 text-turquoise' : 'bg-orange-50 text-orange-dark'}`}>{preview ? '✓ Reçue' : 'À Faire'}</span></span>
      <span className="mt-2.5 block aspect-[4/3] rounded-xl overflow-hidden bg-sable-2">
        {preview ? <img src={preview} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
          : <span className="size-full flex flex-col items-center justify-center gap-1.5 text-orange"><Icon className="size-7" /><span className="text-[11px] font-medium text-center px-2">{hint}</span></span>}
      </span>
      <input type="file" name={name} accept="image/jpeg,image/png,image/webp" capture={capture} required className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; onPick(f ? URL.createObjectURL(f) : null); }} />
    </label>
  );
}
