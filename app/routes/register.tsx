// P08 : inscription, étape 1 sur 3, avec confirmation du numéro par code SMS
import { Form, Link, useActionData, useNavigation, redirect, useFetcher } from 'react-router';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api, formError, getMe } from '~/lib/api.server';
import { login } from '~/lib/session.server';
import { QUARTERS } from '~/lib/format';
import { Alert, Field } from '~/components/ui';
import { AuthFrame, OtpInput, PasswordField, PhoneField } from './_auth';
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
    <AuthFrame step={1} title="Créez Votre Compte" sub="Un seul compte pour acheter et vendre. La vérification d’identité suit, elle est obligatoire."
      image="fabric_stacks" caption="Ouvrez votre boutique et vendez à tout Dakar.">
      <Form method="post" className="space-y-4">
        {a?.error && <Alert>{a.error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom" name="firstName" autoComplete="given-name" required error={e.firstName} className="input h-12" />
          <Field label="Nom" name="lastName" autoComplete="family-name" required error={e.lastName} className="input h-12" />
        </div>
        <div>
          <PhoneField name="phone" required error={e.phone} value={phone} onChange={(ev: any) => setPhone(ev.target.value)} />
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <span className="text-xs">{o?.otpError ? <span className="text-red-700">{o.error}</span> : o?.sent ? <span className="text-turquoise flex items-center gap-1 animate-fade-up"><CheckCircle2 className="size-3.5" />Code envoyé par SMS.{o.devCode ? ` Mode développement : ${o.devCode}` : ''}</span> : <span className="text-muted">Un code vous sera envoyé par SMS.</span>}</span>
            <button type="button" className="text-[13px] font-semibold text-orange disabled:text-muted whitespace-nowrap" disabled={!phone || otp.state !== 'idle'}
              onClick={() => otp.submit({ intent: 'otp', phone }, { method: 'post' })}>{otp.state !== 'idle' ? 'Envoi…' : o?.sent ? 'Renvoyer' : 'Recevoir Le Code'}</button>
          </div>
        </div>
        <OtpInput error={e.code} />
        <Field label="Quartier" error={e.quarter}>
          <Select name="quarter" options={QUARTERS} placeholder="Choisir votre quartier" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <PasswordField label="Mot de passe" name="password" autoComplete="new-password" minLength={8} required error={e.password} hint="Au moins 8 caractères." />
          <PasswordField label="Confirmation" name="password2" autoComplete="new-password" required error={e.password2} />
        </div>
        <label className="flex gap-2.5 text-[12.5px] text-ink-2">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-indigo shrink-0" />
          <span>J’accepte les <Link prefetch="intent" to="/pages/conditions" className="underline">conditions</Link> et la <Link prefetch="intent" to="/pages/confidentialite" className="underline">politique de confidentialité</Link> (loi n° 2008-12 sur les données personnelles).</span>
        </label>
        <button className="btn-primary w-full h-12 press shadow-[0_8px_20px_-10px_rgb(201_67_16/.8)]" disabled={busy}>{busy ? 'Création…' : 'Continuer Vers La Vérification'}</button>
        <p className="text-[13px] text-center text-ink-2">Déjà membre ? <Link prefetch="intent" to="/connexion" className="text-orange font-semibold">Se Connecter</Link></p>
      </Form>
    </AuthFrame>
  );
}
