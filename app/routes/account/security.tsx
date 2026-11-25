// Sécurité Et Données : mot de passe, copie des données, suppression du compte (loi n° 2008-12)
import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router';
import { Download, KeyRound, ShieldCheck, Trash2, LogOut, Info, Undo2 } from 'lucide-react';
import { api, formError, requireMe } from '~/lib/api.server';
import { dateFr } from '~/lib/format';
import { Alert, Field } from '~/components/ui';

export const meta = () => [{ title: 'Sécurité Et Données | Sunu-Market' }];
export async function loader({ request }: any) {
  const me = await requireMe(request, { verified: false });
  // Téléchargement de la copie des données (droit d'accès)
  if (new URL(request.url).searchParams.get('telecharger')) {
    const r = await api(request, '/me/export');
    if (r.ok) return new Response(JSON.stringify(r.data, null, 2), { headers: {
      'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="mes-donnees-sunu-market.json"', 'Cache-Control': 'no-store' } });
  }
  return me;
}
export async function action({ request }: any) {
  const f = await request.formData();
  const intent = f.get('intent');
  if (intent === 'password') {
    if (f.get('next') !== f.get('confirm')) return { error: 'Les deux nouveaux mots de passe ne sont pas identiques.', intent };
    const r = await api(request, '/me/password', { method: 'PATCH', json: { current: f.get('current'), next: f.get('next') } });
    return r.ok ? { ok: 'Mot de passe modifié.', intent } : { ...formError(r), intent };
  }
  if (intent === 'delete') {
    const r = await api(request, '/me/deletion', { json: { confirm: String(f.get('confirm') || '').trim().toUpperCase(), reason: f.get('reason') || undefined } });
    return r.ok ? { ok: 'Demande enregistrée. Vous pouvez l’annuler tant qu’elle n’a pas été traitée.', intent } : { ...formError(r), intent };
  }
  if (intent === 'cancel-delete') {
    await api(request, '/me/deletion', { method: 'DELETE' });
    return { ok: 'Demande de suppression annulée.', intent: 'delete' };
  }
  return null;
}

export default function Security() {
  const me = useLoaderData<typeof loader>() as any;
  const a = useActionData<typeof action>() as any;
  const busy = useNavigation().state === 'submitting';
  const msg = (i: string) => a?.intent === i && (a.ok ? <Alert tone="success">{a.ok}</Alert> : a.error ? <Alert>{a.error}</Alert> : null);
  return (
    <>
      <div>
        <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink animate-fade-up">Sécurité Et Données</h1>
        <p className="text-sm text-muted mt-1">Vos données sont traitées selon la loi n° 2008-12 sur la protection des données personnelles (CDP).</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <Form method="post" className="card p-6 space-y-4" data-reveal="">
          <input type="hidden" name="intent" value="password" />
          <h2 className="font-display font-semibold text-ink flex items-center gap-2"><KeyRound className="size-5 text-turquoise" />Mot De Passe</h2>
          {msg('password')}
          <Field label="Mot de passe actuel" name="current" type="password" autoComplete="current-password" required />
          <Field label="Nouveau mot de passe" name="next" type="password" autoComplete="new-password" minLength={8} required hint="Au moins 8 caractères." />
          <Field label="Confirmer le nouveau mot de passe" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
          <button className="btn-indigo w-full press" disabled={busy}>Modifier Le Mot De Passe</button>
          <p className="text-xs text-muted">Mot de passe oublié ? <Link to="/mot-de-passe-oublie" className="text-orange font-semibold">Recevoir un code par SMS</Link></p>
        </Form>
        <div className="space-y-4">
          <div className="card p-6" data-reveal="">
            <h2 className="font-display font-semibold text-ink flex items-center gap-2"><Download className="size-5 text-turquoise" />Copie De Mes Données</h2>
            <p className="text-sm text-muted mt-1.5">Profil, boutique, annonces, commandes, messages, avis, signalements, paiements et crédits SM-IA, dans un fichier lisible (JSON). Les images de vérification n’y figurent pas : elles sont supprimées dès la décision.</p>
            <a href="?telecharger=1" className="btn-ghost mt-4"><Download className="size-4" />Télécharger Mes Données</a>
          </div>
          <div id="suppression" className="card p-6 scroll-mt-24 border-red-100" data-reveal="">
            <h2 className="font-display font-semibold text-ink flex items-center gap-2"><Trash2 className="size-5 text-red-700" />Supprimer Mon Compte</h2>
            {msg('delete')}
            {me.user.deletionRequestedAt ? (
              <div className="mt-3 space-y-3">
                <Alert tone="info">Demande envoyée le {dateFr(me.user.deletionRequestedAt)}. L’équipe supprime le compte après le délai de rétractation [durée à confirmer].</Alert>
                <Form method="post"><input type="hidden" name="intent" value="cancel-delete" /><button className="btn-ghost press" disabled={busy}><Undo2 className="size-4" />Annuler La Demande</button></Form>
              </div>
            ) : (
              <Form method="post" className="mt-3 space-y-3">
                <input type="hidden" name="intent" value="delete" />
                <p className="text-sm text-muted">Les commandes en cours doivent être terminées. Certaines traces (journal d’audit, paiements à Sunu-Market) sont conservées pour les obligations légales [durée à confirmer].</p>
                <Field label="Raison (facultatif)" name="reason" maxLength={300} />
                <Field label="Tapez SUPPRIMER pour confirmer" name="confirm" required autoComplete="off" pattern="[Ss][Uu][Pp][Pp][Rr][Ii][Mm][Ee][Rr]" />
                <button className="btn bg-red-700 text-white hover:bg-red-800 press" disabled={busy}><Trash2 className="size-4" />Demander La Suppression</button>
              </Form>
            )}
          </div>
          <div className="rounded-2xl bg-indigo-50 p-4 text-[13px] text-indigo flex gap-2.5">
            <ShieldCheck className="size-5 shrink-0" />
            <p>Sunu-Market ne vous demandera jamais votre mot de passe ou un code SMS par téléphone, par SMS ou dans SM-Chat.</p>
          </div>
          <Form method="post" action="/deconnexion"><button className="btn-ghost w-full"><LogOut className="size-4" />Se Déconnecter De Cet Appareil</button></Form>
        </div>
      </div>
    </>
  );
}
