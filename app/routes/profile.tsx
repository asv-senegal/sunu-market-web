// P19 : Mon Profil (/compte) — identité, quartier, vérification, abonnement, crédits et données personnelles
import { Form, Link, useLoaderData, useActionData, useNavigation } from 'react-router';
import { BadgeCheck, Clock, Phone, MapPin, Download, Trash2, Coins, LogOut, ChevronRight } from 'lucide-react';
import { api, requireMe } from '~/lib/api.server';
import { QUARTERS, dateFr } from '~/lib/format';
import { Alert } from '~/components/ui';
import { Select } from '~/components/Select';
import { ACCOUNT_NAV, Avatar } from './account/layout';

export const meta = () => [{ title: 'Mon Profil | Sunu-Market' }];
export async function loader({ request }: any) { return requireMe(request, { verified: false }); }
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/me', { method: 'PATCH', json: { quarter: f.get('quarter') } });
  return r.ok ? { ok: true } : { error: r.data.error };
}
const month = (d: string) => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Africa/Dakar' }).format(new Date(d));
const phoneFr = (p: string) => p?.replace(/^\+221(\d{2})(\d{3})(\d{2})(\d{2})$/, '+221 $1 $2 $3 $4') || p;

export default function Profile() {
  const me = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const u = me.user;
  const verified = u.verificationStatus === 'verified';
  const sub = me.shop?.subscription;
  const daysLeft = sub ? Math.max(0, Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 864e5)) : 0;
  return (
    <>
      <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink animate-fade-up">Mon Profil</h1>
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <Form method="post" className="card p-6 space-y-4" data-reveal="">
          <div className="flex items-center gap-3">
            <Avatar me={me} size={52} />
            <div><p className="font-display font-semibold text-lg text-ink">{u.firstName} {u.lastName}</p>
              <p className="text-[12.5px] text-muted">{me.shop ? 'Commerçant' : 'Membre'}{u.createdAt ? `, membre depuis ${month(u.createdAt)}` : ''}</p></div>
          </div>
          {a?.ok && <Alert tone="success">Quartier mis à jour.</Alert>}
          {a?.error && <Alert>{a.error}</Alert>}
          <label className="block"><span className="label">Numéro de téléphone</span>
            <span className="input flex items-center gap-2 bg-white"><Phone className="size-4 text-muted" /><span className="text-ink">{phoneFr(u.phone)}</span></span>
            <span className="mt-1 block text-xs text-muted">Le numéro sert à la connexion ; pour le changer, contactez l’équipe.</span>
          </label>
          <div><span className="label flex items-center gap-1"><MapPin className="size-3.5" />Quartier</span>
            <Select name="quarter" defaultValue={u.quarter || ''} options={QUARTERS} aria-label="Quartier" /></div>
          <button className="btn-indigo w-full press" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </Form>
        <div className="space-y-4">
          {verified ? (
            <div className="rounded-2xl bg-turquoise-50 border border-turquoise/15 p-5 flex gap-3" data-reveal="">
              <BadgeCheck className="size-7 text-turquoise shrink-0" />
              <div><p className="font-display font-semibold text-ink">Compte Vérifié</p><p className="text-[12.5px] text-turquoise">Identité et visage validés{u.verifiedAt ? ` le ${dateFr(u.verifiedAt)}` : ''}</p></div>
            </div>
          ) : (
            <Link prefetch="intent" to="/verification" className="rounded-2xl bg-orange-50 p-5 flex gap-3 items-center">
              <Clock className="size-7 text-orange shrink-0" /><div className="flex-1"><p className="font-display font-semibold text-ink">Vérification Requise</p><p className="text-[12.5px] text-orange-dark">Pièce d’identité et selfie, étape obligatoire.</p></div><ChevronRight className="size-4" />
            </Link>
          )}
          <div className="card p-5 grid grid-cols-2 gap-4" data-reveal="">
            <div>
              <p className="text-xs text-muted">Abonnement</p>
              {sub ? <p className="font-semibold text-sm mt-1 flex flex-wrap items-center gap-2">{sub.kind === 'trial' ? 'Essai Gratuit' : 'Annuel'}
                <span className="chip bg-[#FDF3D7] text-[#8A5A00]">{daysLeft} jours restants</span></p>
                : <Link prefetch="intent" to="/ma-boutique" className="font-semibold text-sm mt-1 block text-orange">{me.shop ? 'Expiré : renouveler' : 'Ouvrir ma boutique'}</Link>}
            </div>
            <div>
              <p className="text-xs text-muted">Crédits SM-IA</p>
              <p className="font-semibold text-sm mt-1">{(me.credits || 0).toLocaleString('fr-FR')} Crédits</p>
              {me.shop && <Link prefetch="intent" to="/ma-boutique/sm-ia/recharger" className="btn btn-sm mt-2 bg-indigo-50 text-indigo hover:bg-indigo-100"><Coins className="size-3.5" />Recharger</Link>}
            </div>
          </div>
          <div className="card p-5" data-reveal="">
            <p className="font-display font-semibold text-ink">Mes Données (Loi n° 2008-12)</p>
            <p className="text-[12.5px] text-muted mt-1">Obtenez une copie de vos données ou demandez leur suppression.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <a href="/compte/securite?telecharger=1" className="btn-ghost btn-sm"><Download className="size-3.5" />Télécharger Mes Données</a>
              <Link prefetch="intent" to="/compte/securite#suppression" className="btn btn-sm border border-red-200 bg-white text-red-700 hover:bg-red-50"><Trash2 className="size-3.5" />Supprimer Mon Compte</Link>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile (P19 mobile) : le menu du compte remplace la barre latérale */}
      <nav className="lg:hidden card divide-y divide-line" aria-label="Menu du compte">
        {ACCOUNT_NAV.slice(1).map(([to, label, Icon]) => (
          <Link prefetch="intent" key={to} to={to} className="flex items-center gap-3 px-4 py-3.5 text-sm text-ink-2 hover:bg-sable"><Icon className="size-[18px]" /><span className="flex-1">{label}</span><ChevronRight className="size-4 text-muted" /></Link>
        ))}
      </nav>
      <Form method="post" action="/deconnexion" className="lg:hidden"><button className="btn-ghost w-full"><LogOut className="size-4" />Se Déconnecter</button></Form>
    </>
  );
}
