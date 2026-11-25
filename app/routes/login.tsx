// P07 : connexion par mot de passe ou par code SMS
import { Form, Link, useActionData, useNavigation, useSearchParams, redirect } from 'react-router';
import { useState } from 'react';
import { KeyRound, MessageSquareText } from 'lucide-react';
import { api, formError, getMe } from '~/lib/api.server';
import { login } from '~/lib/session.server';
import { Alert, Field } from '~/components/ui';
import { AuthFrame } from './_auth';

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
  return login(r.data.token, await landingPage(request, r.data.user, r.data.token, f.get('suite')));
}

// Page d'arrivée après connexion :
// compte non vérifié → vérification ; page protégée demandée → cette page ;
// équipe (administration, modération, finance, support) → espace administrateur ;
// commerçant avec boutique → Ma Boutique ; sinon → accueil.
const STAFF = ['admin', 'moderator', 'finance', 'support'];
async function landingPage(request: Request, user: any, token: string, suiteIn: FormDataEntryValue | null) {
  if (user?.verificationStatus !== 'verified') return '/verification';
  const suite = typeof suiteIn === 'string' ? suiteIn : '';
  // Uniquement un chemin du site (pas « //autre-site.com » ni « /\autre-site.com »), et pas la page de connexion elle-même
  if (/^\/(?![/\\])/.test(suite) && !suite.startsWith('/connexion') && suite !== '/') return suite;
  if (STAFF.includes(user.role)) return '/admin';
  const shop = await api(request, '/me/shop', { token });
  return shop.ok ? '/ma-boutique' : '/';
}

export default function Login() {
  const a = useActionData<typeof action>() as any;
  const [sp] = useSearchParams();
  const busy = useNavigation().state === 'submitting';
  const [mode, setMode] = useState<'password' | 'sms'>(a?.sent ? 'sms' : 'password');
  return (
    <AuthFrame title="Se Connecter" sub="Heureux de vous revoir sur Sunu-Market.">
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-sable mb-5" role="tablist">
        {[['password', 'Mot De Passe', KeyRound], ['sms', 'Code SMS', MessageSquareText]].map(([k, l, Icon]: any) => (
          <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === k ? 'bg-white text-indigo shadow-sm' : 'text-muted'}`}>
            <Icon className="size-4" />{l}
          </button>
        ))}
      </div>
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      {mode === 'password' ? (
        <Form method="post" className="space-y-4 animate-fade-up" key="pw">
          <input type="hidden" name="intent" value="password" /><input type="hidden" name="suite" value={sp.get('suite') || '/'} />
          <Field label="Numéro De Téléphone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="77 123 45 67" required />
          <Field label="Mot De Passe" name="password" type="password" autoComplete="current-password" required />
          <button className="btn-primary w-full press" disabled={busy}>{busy ? 'Connexion…' : 'Se Connecter'}</button>
        </Form>
      ) : (
        <div className="space-y-4 animate-fade-up" key="sms">
          <Form method="post" className="flex gap-2 items-end">
            <input type="hidden" name="intent" value="otp-send" />
            <div className="flex-1"><Field label="Numéro De Téléphone" name="phone" type="tel" inputMode="tel" placeholder="77 123 45 67" defaultValue={a?.phone || ''} required /></div>
            <button className="btn-ghost" disabled={busy}>{a?.sent ? 'Renvoyer' : 'Recevoir Le Code'}</button>
          </Form>
          {a?.sent && (
            <Form method="post" className="space-y-4 animate-fade-up">
              <input type="hidden" name="intent" value="otp-login" /><input type="hidden" name="phone" value={a.phone} /><input type="hidden" name="suite" value={sp.get('suite') || '/'} />
              <Field label="Code Reçu Par SMS" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="6 chiffres" required
                hint={a.devCode ? `Mode développement : code ${a.devCode}` : 'Valable 10 minutes.'} />
              <button className="btn-primary w-full press" disabled={busy}>Se Connecter</button>
            </Form>
          )}
        </div>
      )}
      <p className="text-sm text-center text-muted mt-5">Pas encore membre ? <Link prefetch="intent" to="/inscription" className="text-orange font-semibold">S’inscrire</Link></p>
    </AuthFrame>
  );
}
