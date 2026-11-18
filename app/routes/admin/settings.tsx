// P36 : paramètres et rôles (droits par rôle, équipe, tarifs décidés ou à confirmer, sécurité)
import { Form, Link, useActionData, useLoaderData, useSearchParams } from 'react-router';
import { Plus, Check } from 'lucide-react';
import { api, apiOrThrow } from '~/lib/api.server';
import { Alert, PageTitle } from '~/components/ui';
import { Select } from '~/components/Select';

export async function loader({ request }: any) {
  const [team, s] = await Promise.all([apiOrThrow(request, '/admin/team'), apiOrThrow(request, '/admin/settings')]);
  return { ...team, settings: Object.fromEntries(s.items.map((x: any) => [x.key, x])) };
}
export async function action({ request }: any) {
  const f = await request.formData();
  const i = f.get('intent');
  let r: any;
  if (i === 'perms') {
    const perms: any = {};
    for (const role of ['moderator', 'finance', 'support']) perms[role] = PERMS.map(([p]) => p).filter((p) => f.get(`${role}:${p}`) === 'on');
    r = await api(request, '/admin/settings/role_permissions', { method: 'PATCH', json: { value: perms } });
  }
  if (i === 'member') r = await api(request, '/admin/team', { json: { phone: f.get('phone'), role: f.get('role') } });
  if (i === 'tarif') {
    const raw = String(f.get('value')).trim();
    r = await api(request, `/admin/settings/${f.get('key')}`, { method: 'PATCH', json: { value: raw === '' ? null : Number(raw), confirmed: f.get('confirmed') === 'on' } });
  }
  return r?.ok ? { ok: 'Enregistré et journalisé.' } : { error: r?.data?.error || 'Erreur.' };
}
const PERMS: [string, string][] = [['verify', 'Vérifier Les Identités'], ['moderate', 'Signalements Et Annonces'], ['revenue', 'Revenus Et Remboursements'], ['smia', 'Régler SM-IA'], ['export', 'Exporter Les Données']];
const ROLES: [string, string][] = [['admin', 'Administrateur'], ['moderator', 'Modérateur'], ['finance', 'Finance'], ['support', 'Support']];
const TARIFS: [string, string, string][] = [
  ['subscription_annual_fcfa', 'Abonnement annuel', 'FCFA'], ['trial_days', 'Période d’essai', 'jours'], ['smia_recharge_commission_pct', 'Commission recharge SM-IA', '%'],
  ['smia_credits_per_1000_fcfa', 'Crédits SM-IA pour 1 000 FCFA', 'crédits'], ['smia_trial_credits', 'Crédits offerts pendant l’essai', 'crédits'], ['smia_subscription_credits', 'Crédits inclus dans l’abonnement', 'crédits'],
  ['featured_price_per_day_fcfa', 'Mise en avant', 'FCFA / jour'], ['campaign_price_per_day_fcfa', 'Campagne promotionnelle', 'FCFA / jour'], ['ad_price_per_day_fcfa', 'Publicité', 'FCFA / jour'],
];
const TABS = [['roles', 'Rôles Et Droits'], ['tarifs', 'Tarifs'], ['securite', 'Sécurité']];

export default function Settings() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const [sp] = useSearchParams();
  const tab = sp.get('vue') || 'roles';
  const perms = d.permissions || {};
  return (
    <>
      <PageTitle title="Paramètres Et Rôles" />
      <div className="flex gap-2 mb-5">{TABS.map(([k, l]) => <Link prefetch="intent" key={k} to={`?vue=${k}`} className={`chip py-1.5 px-3 ${tab === k ? 'bg-indigo text-white' : 'bg-white border border-sable-dark'}`}>{l}</Link>)}</div>
      {a?.ok && <div className="mb-4"><Alert tone="success">{a.ok}</Alert></div>}
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      {tab === 'roles' && (
        <div className="space-y-6 animate-fade-up">
          <Form method="post" className="card overflow-x-auto">
            <input type="hidden" name="intent" value="perms" />
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted"><tr><th className="p-3">Rôle</th>{PERMS.map(([, l]) => <th key={l} className="p-3 text-center">{l}</th>)}</tr></thead>
              <tbody className="divide-y divide-sable-dark">
                {ROLES.map(([r, l]) => (
                  <tr key={r}><td className="p-3"><b>{l}</b><span className="block text-xs text-muted">{d.members.filter((m: any) => m.role === r).length} membre(s)</span></td>
                    {PERMS.map(([p]) => <td key={p} className="p-3 text-center">{r === 'admin' ? <Check className="size-4 text-turquoise mx-auto" /> : <input type="checkbox" name={`${r}:${p}`} defaultChecked={(perms[r] || []).includes(p)} className="size-4 accent-turquoise" aria-label={`${l} : ${p}`} />}</td>)}</tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-sable-dark"><button className="btn-indigo btn-sm">Enregistrer Les Droits</button></div>
          </Form>
          <div className="card p-5">
            <h2 className="font-display font-semibold text-indigo mb-3">Équipe</h2>
            <ul className="divide-y divide-sable-dark text-sm mb-4">{d.members.map((m: any) => <li key={m.id} className="py-2 flex justify-between"><span>{m.first_name} {m.last_name} <span className="text-xs text-muted">{m.phone}</span></span><span className="chip bg-indigo-50 text-indigo">{ROLES.find(([r]) => r === m.role)?.[1]}</span></li>)}</ul>
            <Form method="post" className="flex flex-wrap gap-2"><input type="hidden" name="intent" value="member" />
              <input name="phone" required placeholder="Numéro d’un compte vérifié" className="input h-9 max-w-xs" />
              <Select name="role" size="sm" defaultValue="moderator" className="w-48" aria-label="Rôle" options={[...ROLES, ['member', 'Retirer De L’Équipe']].map(([r, l]) => ({ value: r, label: l }))} />
              <button className="btn-primary btn-sm"><Plus className="size-3.5" />Inviter Un Membre</button></Form>
          </div>
        </div>
      )}
      {tab === 'tarifs' && (
        <div className="card divide-y divide-sable-dark animate-fade-up">
          <div className="p-4 text-sm"><b>Commission sur les ventes</b> : 0 % (aucune) <span className="chip bg-turquoise-50 text-turquoise ml-2">Décidé</span></div>
          {TARIFS.map(([k, l, u]) => {
            const s = d.settings[k];
            if (!s) return null;
            return (
              <Form key={k} method="post" className="p-4 flex flex-wrap items-center gap-3">
                <input type="hidden" name="intent" value="tarif" /><input type="hidden" name="key" value={k} />
                <span className="flex-1 min-w-[200px] text-sm font-medium">{l}</span>
                <span className="relative"><input name="value" defaultValue={s.value ?? ''} placeholder="[à confirmer]" className="input h-9 w-36 pr-14" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">{u}</span></span>
                <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="confirmed" defaultChecked={s.confirmed} className="accent-turquoise" />Décidé</label>
                <span className={`chip ${s.confirmed ? 'bg-turquoise-50 text-turquoise' : 'bg-[#FCF1D8] text-[#8A5B00]'}`}>{s.confirmed ? 'Décidé' : 'À Confirmer'}</span>
                <button className="btn-ghost btn-sm">Enregistrer</button>
              </Form>
            );
          })}
        </div>
      )}
      {tab === 'securite' && (
        <div className="card divide-y divide-sable-dark animate-fade-up">
          {[['Vérification d’identité obligatoire', true, 'Imposée par le produit : aucun compte actif sans validation.'], ['Double validation des remboursements', d.settings.refund_double_validation?.value, 'Finance puis administrateur, deux personnes distinctes.'], ['Journal d’audit chaîné', true, 'Ajout seul, empreinte SHA-256 de chaque ligne.'], ['Suppression des pièces après décision', true, 'Minimisation des données (loi n° 2008-12).'], ['Double authentification de l’équipe', false, 'À mettre en place avant l’ouverture au public [à confirmer].']].map(([t, on, s]: any) => (
            <div key={t} className="p-4 flex items-center gap-3"><span className="flex-1"><b className="text-sm block">{t}</b><span className="text-xs text-muted">{s}</span></span><span className={`chip ${on ? 'bg-turquoise-50 text-turquoise' : 'bg-[#FCF1D8] text-[#8A5B00]'}`}>{on ? 'Actif' : 'À Venir'}</span></div>
          ))}
        </div>
      )}
    </>
  );
}
