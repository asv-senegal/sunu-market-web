// Mot de passe oublié : code SMS puis nouveau mot de passe (lien depuis P07)
import { Form, Link, useActionData, useNavigation, redirect } from 'react-router';
import { api, formError, getMe } from '~/lib/api.server';
import { login } from '~/lib/session.server';
import { Alert } from '~/components/ui';
import { AuthFrame, OtpInput, PasswordField, PhoneField } from './_auth';

export const meta = () => [{ title: 'Mot De Passe Oublié | Sunu-Market' }];
export async function loader({ request }: any) { return (await getMe(request)) ? redirect('/compte/securite') : null; }
export async function action({ request }: any) {
  const f = await request.formData();
  if (f.get('intent') === 'send') {
    const r = await api(request, '/auth/otp', { json: { phone: f.get('phone'), purpose: 'reset' } });
    return r.ok ? { sent: true, phone: f.get('phone'), devCode: r.data.devCode } : formError(r);
  }
  if (f.get('password') !== f.get('password2')) return { error: 'Les deux mots de passe ne sont pas identiques.', sent: true, phone: f.get('phone') };
  const r = await api(request, '/auth/reset-password', { json: { phone: f.get('phone'), code: f.get('code'), password: f.get('password') } });
  if (!r.ok) return { ...formError(r), sent: true, phone: f.get('phone') };
  return login(r.data.token, r.data.user.verificationStatus === 'verified' ? '/?reinitialise=1' : '/verification');
}

export default function Forgot() {
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  return (
    <AuthFrame title="Mot De Passe Oublié" sub={a?.sent ? `Saisissez le code envoyé au +221 ${a.phone} et choisissez un nouveau mot de passe.` : 'Recevez un code par SMS pour choisir un nouveau mot de passe.'}
      image="dakar_phone" caption="Votre compte reste protégé par votre numéro.">
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      {!a?.sent ? (
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="send" />
          <PhoneField name="phone" required />
          <button className="btn-primary w-full h-12 press" disabled={busy}>{busy ? 'Envoi…' : 'Recevoir Le Code'}</button>
          <p className="text-xs text-muted">Pour votre sécurité, nous n’indiquons pas si le numéro possède un compte. Le code est valable 10 minutes.</p>
        </Form>
      ) : (
        <Form method="post" className="space-y-4 animate-fade-up">
          <input type="hidden" name="intent" value="reset" /><input type="hidden" name="phone" value={a.phone} />
          <OtpInput hint={a.devCode ? `Mode développement : code ${a.devCode}` : 'Valable 10 minutes.'} />
          <PasswordField label="Nouveau mot de passe" name="password" autoComplete="new-password" minLength={8} required hint="Au moins 8 caractères." />
          <PasswordField label="Confirmer le mot de passe" name="password2" autoComplete="new-password" minLength={8} required />
          <button className="btn-primary w-full h-12 press" disabled={busy}>{busy ? 'Enregistrement…' : 'Changer Mon Mot De Passe'}</button>
        </Form>
      )}
      <p className="text-[13px] text-center text-ink-2 mt-6"><Link prefetch="intent" to="/connexion" className="text-orange font-semibold">Retour À La Connexion</Link></p>
    </AuthFrame>
  );
}
