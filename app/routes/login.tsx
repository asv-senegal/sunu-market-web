// P07 : connexion par mot de passe ou par code SMS
import { Form, Link, useActionData, useNavigation, useSearchParams, redirect } from 'react-router';
import { useState } from 'react';
import { KeyRound, Phone } from 'lucide-react';
import { api, formError, getMe } from '~/lib/api.server';
import { login } from '~/lib/session.server';
import { Alert } from '~/components/ui';
import { AuthFrame, OtpInput, PasswordField, PhoneField } from './_auth';

export const meta = () => [{ title: 'Se Connecter | Sunu-Market' }];
export async function loader({ request }: any) { return (await getMe(request)) ? redirect('/') : null; }

export async function action({ request }: any) {
  const f = await request.formData();
  const intent = f.get('intent');
  if (intent === 'otp-send') {
    const r = await api(request, '/auth/otp', { json: { phone: f.get('phone'), purpose: 'login' } });
    return r.ok ? { sent: true, phone: f.get('phone'), devCode: r.data.devCode } : formError(r);
  }
  const r = intent === 'otp-login'
    ? await api(request, '/auth/login-otp', { json: { phone: f.get('phone'), code: f.get('code') } })
    : await api(request, '/auth/login', { json: { phone: f.get('phone'), password: f.get('password') } });
  if (!r.ok) return { ...formError(r), sent: intent === 'otp-login', phone: f.get('phone') };
  const suite = String(f.get('suite') || '/');
  const to = r.data.user.verificationStatus === 'verified' ? (suite.startsWith('/') ? suite : '/') : '/verification';
  return login(r.data.token, to);
}

export default function Login() {
  const a = useActionData<typeof action>() as any;
  const [sp] = useSearchParams();
  const busy = useNavigation().state === 'submitting';
  const [mode, setMode] = useState<'password' | 'sms'>(a?.sent ? 'sms' : 'password');
  const suite = <input type="hidden" name="suite" value={sp.get('suite') || '/'} />;
  return (
    <AuthFrame title="Bon Retour Parmi Nous" sub={mode === 'password' ? 'Connectez-vous avec votre numéro de téléphone.' : 'Recevez un code à 6 chiffres par SMS.'}
      image="man_phone_park" caption="Retrouvez vos boutiques préférées et vos commandes.">
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      {sp.get('reinitialise') && <div className="mb-4"><Alert tone="success">Mot de passe modifié. Vous êtes connecté.</Alert></div>}
      {mode === 'password' ? (
        <Form method="post" className="space-y-4 animate-fade-up" key="pw">
          <input type="hidden" name="intent" value="password" />{suite}
          <PhoneField name="phone" required defaultValue={a?.phone || ''} />
          <PasswordField name="password" autoComplete="current-password" required />
          <div className="flex items-center justify-between text-[13px]">
            <label className="flex items-center gap-2 text-ink-2"><input type="checkbox" name="remember" defaultChecked className="size-4 accent-indigo" />Rester connecté sur cet appareil</label>
            <Link prefetch="intent" to="/mot-de-passe-oublie" className="text-orange font-semibold hover:underline">Mot De Passe Oublié</Link>
          </div>
          <button className="btn-primary w-full h-12 press shadow-[0_8px_20px_-10px_rgb(201_67_16/.8)]" disabled={busy}>{busy ? 'Connexion…' : 'Se Connecter'}</button>
          <button type="button" onClick={() => setMode('sms')} className="btn-ghost w-full h-12 text-ink"><Phone className="size-4" />Recevoir Un Code Par SMS</button>
        </Form>
      ) : (
        <div className="space-y-4 animate-fade-up" key="sms">
          <Form method="post" className="space-y-3">
            <input type="hidden" name="intent" value="otp-send" />
            <PhoneField name="phone" required defaultValue={a?.phone || ''} />
            <button className="btn-ghost w-full h-12" disabled={busy}>{a?.sent ? 'Renvoyer Le Code' : 'Recevoir Le Code'}</button>
          </Form>
          {a?.sent && (
            <Form method="post" className="space-y-4 animate-fade-up">
              <input type="hidden" name="intent" value="otp-login" /><input type="hidden" name="phone" value={a.phone} />{suite}
              <OtpInput hint={a.devCode ? `Mode développement : code ${a.devCode}` : 'Valable 10 minutes.'} />
              <button className="btn-primary w-full h-12 press" disabled={busy}>Se Connecter</button>
            </Form>
          )}
          <button type="button" onClick={() => setMode('password')} className="text-[13px] text-indigo font-semibold w-full flex items-center justify-center gap-1.5"><KeyRound className="size-4" />Utiliser mon mot de passe</button>
        </div>
      )}
      <p className="text-[13px] text-center text-ink-2 mt-6">Pas encore de compte ? <Link prefetch="intent" to="/inscription" className="text-orange font-semibold">Créer Un Compte</Link></p>
    </AuthFrame>
  );
}
