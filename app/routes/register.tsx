// P08 : inscription, étape 1 sur 3, avec confirmation du numéro par code SMS
import { Form, Link, useActionData, useNavigation, redirect, useFetcher } from 'react-router';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api, formError, getMe } from '~/lib/api.server';
import { login } from '~/lib/session.server';
import { QUARTERS } from '~/lib/format';
import { Alert, Field } from '~/components/ui';
import { AuthFrame } from './_auth';
import { Select } from '~/components/Select';

export const meta = () => [{ title: 'S’inscrire | Sunu-Market' }];
export async function loader({ request }: any) { return (await getMe(request)) ? redirect('/') : null; }

export async function action({ request }: any) {
  const f = await request.formData();
  if (f.get('intent') === 'otp') {
    const r = await api(request, '/auth/otp', { json: { phone: f.get('phone'), purpose: 'register' } });
    return r.ok ? { sent: true, devCode: r.data.devCode } : { ...formError(r), otpError: true };
  }
  if (f.get('password') !== f.get('password2')) return { error: 'Les deux mots de passe ne correspondent pas.', fields: { password2: ['Différent du mot de passe.'] } };
  const r = await api(request, '/auth/register', { json: {
    firstName: f.get('firstName'), lastName: f.get('lastName'), phone: f.get('phone'), password: f.get('password'),
    quarter: f.get('quarter') || undefined, consent: f.get('consent') === 'on', code: f.get('code') || undefined,
  } });
  if (!r.ok) return formError(r);
  return login(r.data.token, '/verification');
}

export default function Register() {
  const a = useActionData<typeof action>() as any;
  const otp = useFetcher<typeof action>();
  const o = otp.data as any;
  const e = a?.fields || {};
  const busy = useNavigation().state === 'submitting';
  const [phone, setPhone] = useState('');
  return (
    <AuthFrame step={1} title="Créer Mon Compte" sub="Étape 1 sur 3 : vos informations et votre numéro. La vérification d’identité suit, elle est obligatoire.">
      <Form method="post" className="space-y-4">
        {a?.error && <Alert>{a.error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" name="firstName" autoComplete="given-name" required error={e.firstName} />
          <Field label="Nom" name="lastName" autoComplete="family-name" required error={e.lastName} />
        </div>
        <div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><Field label="Numéro De Téléphone" name="phone" type="tel" inputMode="tel" placeholder="77 123 45 67" required error={e.phone} value={phone} onChange={(ev: any) => setPhone(ev.target.value)} /></div>
            <button type="button" className="btn-ghost" disabled={!phone || otp.state !== 'idle'}
              onClick={() => otp.submit({ intent: 'otp', phone }, { method: 'post' })}>{o?.sent ? 'Renvoyer' : 'Recevoir Le Code'}</button>
          </div>
          {o?.otpError && <p className="text-xs text-red-700 mt-1">{o.error}</p>}
          {o?.sent && <p className="text-xs text-turquoise mt-1 flex items-center gap-1 animate-fade-up"><CheckCircle2 className="size-3.5" />Code envoyé par SMS.{o.devCode ? ` Mode développement : ${o.devCode}` : ''}</p>}
        </div>
        <Field label="Code Reçu Par SMS" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 chiffres" required error={e.code} />
        <Field label="Quartier" error={e.quarter}>
          <Select name="quarter" options={QUARTERS} placeholder="Choisir votre quartier" />
        </Field>
        <Field label="Mot De Passe" name="password" type="password" autoComplete="new-password" minLength={8} required error={e.password} hint="Au moins 8 caractères." />
        <Field label="Confirmer Le Mot De Passe" name="password2" type="password" autoComplete="new-password" required error={e.password2} />
        <label className="flex gap-2 text-sm text-ink/85">
          <input type="checkbox" name="consent" required className="mt-1 accent-orange" />
          <span>J’accepte les <Link prefetch="intent" to="/pages/conditions" className="underline">conditions</Link> et le traitement de mes données selon la <Link prefetch="intent" to="/pages/confidentialite" className="underline">politique de confidentialité</Link> (loi n° 2008-12).</span>
        </label>
        <button className="btn-primary w-full press" disabled={busy}>{busy ? 'Création…' : 'Continuer'}</button>
        <p className="text-sm text-center text-muted">Déjà membre ? <Link prefetch="intent" to="/connexion" className="text-orange font-semibold">Se Connecter</Link></p>
      </Form>
    </AuthFrame>
  );
}
