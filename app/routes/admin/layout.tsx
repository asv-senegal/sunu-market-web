// Espace Administrateur (P29 à P36) : application pleine page, barre latérale sombre, menu selon les droits du rôle
import { Link, Outlet, useLoaderData } from 'react-router';
import { LineChart, ScanFace, Package, Flag, Wallet, Sparkles, FileText, Settings, Bell, ShieldCheck } from 'lucide-react';
import { api, apiOrThrow, requireMe } from '~/lib/api.server';
import { AppShell, usePageTitle, type ShellGroup } from '~/components/AppShell';
import { Logo } from '~/components/Shell';

export const meta = () => [{ title: 'Espace Administrateur | Sunu-Market' }];
export async function loader({ request }: any) {
  const me = await requireMe(request, { role: ['admin', 'moderator', 'finance', 'support'] });
  const [adm, stats] = await Promise.all([apiOrThrow(request, '/admin/me'), api(request, '/admin/stats')]);
  return { ...adm, me, k: stats.ok ? stats.data.kpi : {} };
}
const ROLE: Record<string, string> = { admin: 'Administrateur', moderator: 'Modérateur', finance: 'Finance', support: 'Support' };

export default function AdminLayout() {
  const { perms, role, me, k } = useLoaderData<typeof loader>() as any;
  const title = usePageTitle('Tableau De Bord');
  const can = (p: string | null) => !p || perms.includes(p);
  const all: [string, [string, string, any, string | null, number?][]][] = [
    ['Pilotage', [['/admin', 'Tableau De Bord', LineChart, null]]],
    ['Confiance', [['/admin/verifications', 'Vérifications', ScanFace, 'verify', k.pending_verifications], ['/admin/annonces', 'Annonces Et Boutiques', Package, 'moderate', k.flagged_listings],
      ['/admin/signalements', 'Signalements', Flag, 'moderate', k.open_reports]]],
    ['Revenus', [['/admin/revenus', 'Revenus De La Plateforme', Wallet, 'revenue', k.pending_payments]]],
    ['Contrôle', [['/admin/sm-ia', 'SM-IA Et Crédits', Sparkles, 'smia'], ['/admin/journal', 'Journal D’Audit', FileText, 'export'], ['/admin/parametres', 'Paramètres Et Rôles', Settings, 'settings']]],
  ];
  const groups: ShellGroup[] = all.map(([t, items]) => ({ title: t, items: items.filter(([, , , p]) => can(p)).map(([to, label, icon, , badge]) => ({ to, label, icon, badge, end: to === '/admin' })) })).filter((g) => g.items.length);
  const brand = <div><Logo light className="text-lg" /><p className="text-xs text-[#7C86B3] mt-1">Espace Administrateur</p></div>;
  const foot = (
    <Link prefetch="intent" to="/compte/securite" className="flex gap-2.5 items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      <span className="size-[34px] rounded-full bg-turquoise text-white text-xs font-semibold flex items-center justify-center">{me.user.firstName[0]}{me.user.lastName[0]}</span>
      <div className="min-w-0"><p className="text-white font-semibold text-[13px] truncate">{me.user.firstName} {me.user.lastName[0]}.</p><p className="text-[11.5px] text-[#7C86B3]">{ROLE[role]}</p></div>
    </Link>
  );
  const actions = (
    <>
      <span className="hidden sm:inline-flex chip bg-turquoise-50 text-turquoise py-1 px-2.5" title="Connexion chiffrée, chaque consultation sensible est inscrite au journal d’audit"><ShieldCheck className="size-3.5" />Session Sécurisée</span>
      <Link prefetch="intent" to="/notifications" className="relative p-2 rounded-full text-ink-2 hover:bg-sable" aria-label="Notifications">
        <Bell className="size-[21px]" />{me.unread?.notifications > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-orange ring-2 ring-white" />}
      </Link>
    </>
  );
  return (
    <AppShell dark brand={brand} groups={groups} foot={foot} title={title} actions={actions}
      search={{ action: '/admin/recherche', placeholder: 'Rechercher un compte, un ID…' }}>
      <Outlet />
    </AppShell>
  );
}
