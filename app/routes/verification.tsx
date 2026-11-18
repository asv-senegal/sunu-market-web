// Étapes 2 et 3 : vérification d'identité obligatoire (pas de « Plus tard »)
import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from 'react-router';
import { useState } from 'react';
import { IdCard, Camera, Clock, BadgeCheck, ShieldCheck, XCircle } from 'lucide-react';
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
      <AuthFrame step={3} title="Compte Vérifié">
        <div className="text-center py-4">
          <BadgeCheck className="size-16 text-turquoise mx-auto" />
          <p className="mt-4 text-ink/85">Bienvenue {me.user.firstName} ! Vous pouvez acheter, échanger dans SM-Chat et ouvrir votre boutique avec 14 jours d’essai gratuit.</p>
          <div className="grid grid-cols-2 gap-3 mt-6"><Link prefetch="intent" to="/" className="btn-ghost">Découvrir</Link><Link prefetch="intent" to="/ma-boutique" className="btn-primary">Ouvrir Ma Boutique</Link></div>
        </div>
      </AuthFrame>
    );
  }
  if (status === 'pending') {
    return (
      <AuthFrame step={3} title="Vérification En Cours">
        <div className="text-center py-4">
          <Clock className="size-14 text-orange mx-auto" />
          <p className="mt-4 text-ink/85">Votre dossier a été envoyé le {dateFr(v.last.submitted_at)}. Un membre de l’équipe le vérifie ; vous recevrez une notification.</p>
          <p className="text-sm text-muted mt-3">Votre compte reste inactif jusqu’à la décision. Délai indicatif : [à confirmer].</p>
          <p className="text-xs text-muted mt-6">Abonnement boutique après validation : 14 jours d’essai, puis 2 500 FCFA par an. Acheter reste gratuit.</p>
        </div>
      </AuthFrame>
    );
  }
  return (
    <AuthFrame step={2} title="Vérifier Mon Identité" sub="Étape 2 sur 3 : obligatoire pour activer votre compte.">
      {status === 'rejected' && <div className="mb-4"><Alert><span className="inline-flex items-center gap-1 font-semibold"><XCircle className="size-4" />Dossier refusé</span> : {v.last?.reason}. Vous pouvez en soumettre un nouveau.</Alert></div>}
      <Form method="post" encType="multipart/form-data" className="space-y-5">
        {a?.error && <Alert>{a.error}</Alert>}
        <label className="block"><span className="label">Type De Pièce</span>
          <Select name="docType" defaultValue="cni" options={[{ value: 'cni', label: 'Carte D’Identité CEDEAO' }, { value: 'passport', label: 'Passeport' }, { value: 'residence', label: 'Carte De Séjour' }]} />
        </label>
        <Upload icon={IdCard} name="document" label="Photo De La Pièce" hint="Recto lisible, sans reflet." preview={doc} onPick={setDoc} />
        <Upload icon={Camera} name="selfie" label="Selfie" hint="Votre visage de face, bien éclairé." preview={selfie} onPick={setSelfie} capture="user" />
        <p className="text-xs text-muted flex gap-2"><ShieldCheck className="size-4 shrink-0 text-turquoise" />Ces images servent uniquement à la vérification. Elles sont supprimées dès la décision (loi n° 2008-12).</p>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer Pour Vérification'}</button>
      </Form>
    </AuthFrame>
  );
}

function Upload({ icon: Icon, name, label, hint, preview, onPick, capture }: any) {
  return (
    <label className="block cursor-pointer">
      <span className="label">{label}</span>
      <span className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-sable-dark bg-sable p-4 hover:border-turquoise">
        {preview ? <img src={preview} alt="" className="size-16 rounded-xl object-cover" /> : <span className="size-16 rounded-xl bg-white text-indigo flex items-center justify-center"><Icon className="size-7" /></span>}
        <span className="text-sm"><span className="font-semibold text-indigo block">{preview ? 'Changer L’Image' : 'Prendre Ou Choisir Une Photo'}</span><span className="text-muted text-xs">{hint}</span></span>
      </span>
      <input type="file" name={name} accept="image/jpeg,image/png,image/webp" capture={capture} required className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; onPick(f ? URL.createObjectURL(f) : null); }} />
    </label>
  );
}
