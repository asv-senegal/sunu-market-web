import { Form, Link, useLoaderData, useActionData } from 'react-router';
import { BadgeCheck, Store, ShoppingBag, Heart, LogOut, Shield, Clock, Coins, Flag, Bell } from 'lucide-react';
import { api, requireMe } from '~/lib/api.server';
import { QUARTERS, dateFr } from '~/lib/format';
import { Alert } from '~/components/ui';
import { Select } from '~/components/Select';

export const meta = () => [{ title: 'Mon Profil | Sunu-Market' }];
export async function loader({ request }: any) { return requireMe(request, { verified: false }); }
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/me', { method: 'PATCH', json: { quarter: f.get('quarter') } });
  return r.ok ? { ok: true } : { error: r.data.error };
}

export default function Profile() {
  const me = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const u = me.user;
  const verified = u.verificationStatus === 'verified';
  return (
    <div className="container-x py-6 max-w-2xl space-y-4">
      <div className="card p-6 flex items-center gap-4 animate-fade-up">
        <span className="size-16 rounded-full bg-indigo text-white flex items-center justify-center font-display text-xl font-bold">{u.firstName[0]}{u.lastName[0]}</span>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-indigo">{u.firstName} {u.lastName}</h1>
          <p className="text-sm text-muted">{u.phone} · {u.quarter || 'Dakar'}</p>
          {verified ? <span className="chip bg-turquoise-50 text-turquoise mt-1"><BadgeCheck className="size-3" />Compte Vérifié</span>
            : <Link prefetch="intent" to="/verification" className="chip bg-orange-50 text-orange-dark mt-1"><Clock className="size-3" />Vérification Requise</Link>}
        </div>
      </div>
      <div className="card divide-y divide-sable-dark">
        <Row to="/commandes" icon={ShoppingBag} label="Mes Commandes" />
        <Row to="/ma-boutique" icon={Store} label={me.shop ? `Ma Boutique : ${me.shop.name}` : 'Ouvrir Ma Boutique'}
          note={me.shop?.subscription ? `${me.shop.subscription.kind === 'trial' ? 'Essai' : 'Abonnement'} jusqu’au ${dateFr(me.shop.subscription.endsAt)}` : undefined} />
        {me.shop && <Row to="/ma-boutique/sm-ia" icon={Coins} label="Crédits SM-IA" note={`${(me.credits || 0).toLocaleString('fr-FR')} crédits`} />}
        <Row to="/notifications" icon={Bell} label="Notifications Et Préférences" />
        <Row to="/signalements" icon={Flag} label="Mes Signalements" />
        {['admin', 'moderator', 'finance', 'support'].includes(u.role) && <Row to="/admin" icon={Shield} label="Espace Administrateur" />}
      </div>
      <Form method="post" className="card p-5 space-y-3">
        <h2 className="font-display font-semibold text-indigo">Mon Quartier</h2>
        {a?.ok && <Alert tone="success">Quartier mis à jour.</Alert>}
        <div className="flex gap-2">
          <Select name="quarter" defaultValue={u.quarter || ''} options={QUARTERS} className="flex-1" aria-label="Quartier" />
          <button className="btn-indigo">Enregistrer</button>
        </div>
        <p className="text-xs text-muted">Vos données sont traitées selon la loi n° 2008-12. Pour toute demande d’accès ou de suppression, contactez l’équipe Sunu-Market.</p>
      </Form>
      <Form method="post" action="/deconnexion"><button className="btn-ghost w-full"><LogOut className="size-4" />Se Déconnecter</button></Form>
    </div>
  );
}
function Row({ to, icon: Icon, label, note }: any) {
  return (
    <Link prefetch="intent" to={to} className="flex items-center gap-3 p-4 hover:bg-sable">
      <Icon className="size-5 text-turquoise" /><span className="flex-1 font-medium">{label}</span>{note && <span className="text-xs text-muted">{note}</span>}
    </Link>
  );
}
