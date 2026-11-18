// Espace Administrateur : le menu suit les droits du rôle (P36)
import { NavLink, Outlet, useLoaderData } from 'react-router';
import { LayoutDashboard, IdCard, Package, Flag, Wallet, Sparkles, ScrollText, Settings } from 'lucide-react';
import { apiOrThrow, requireMe } from '~/lib/api.server';

export const meta = () => [{ title: 'Espace Administrateur | Sunu-Market' }];
export async function loader({ request }: any) {
  await requireMe(request, { role: ['admin', 'moderator', 'finance', 'support'] });
  return apiOrThrow(request, '/admin/me');
}
const NAV: [string, string, any, string | null][] = [
  ['/admin', 'Tableau De Bord', LayoutDashboard, null], ['/admin/verifications', 'Vérifications', IdCard, 'verify'],
  ['/admin/annonces', 'Annonces Et Boutiques', Package, 'moderate'], ['/admin/signalements', 'Signalements', Flag, 'moderate'],
  ['/admin/revenus', 'Revenus De La Plateforme', Wallet, 'revenue'], ['/admin/sm-ia', 'SM-IA Et Crédits', Sparkles, 'smia'],
  ['/admin/journal', 'Journal D’Audit', ScrollText, 'export'], ['/admin/parametres', 'Paramètres Et Rôles', Settings, 'settings'],
];
const ROLE: Record<string, string> = { admin: 'Administrateur', moderator: 'Modérateur', finance: 'Finance', support: 'Support' };

export default function AdminLayout() {
  const { perms, role } = useLoaderData<typeof loader>();
  return (
    <div className="container-x py-6 grid md:grid-cols-[250px_1fr] gap-6">
      <nav className="card p-2 h-fit md:sticky md:top-36 flex md:flex-col gap-1 overflow-x-auto no-scrollbar bg-indigo border-indigo animate-fade-up">
        <div className="hidden md:block px-3 pt-2 pb-3"><p className="font-display font-semibold text-white">Espace Administrateur</p><p className="text-xs text-white/60">{ROLE[role]}</p></div>
        {NAV.filter(([, , , p]) => !p || perms.includes(p)).map(([to, label, Icon]) => (
          <NavLink prefetch="intent" key={to} to={to} end={to === '/admin'} viewTransition className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-white text-indigo font-semibold' : 'text-white/80 hover:bg-white/10'}`}>
            <Icon className="size-4" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="min-w-0"><Outlet /></div>
    </div>
  );
}
