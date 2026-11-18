// Espace « Ma Boutique » (commerçant, côté vente) : groupes Ma Boutique, Visibilité, SM-IA, Compte
import { NavLink, Outlet, useLoaderData, Link } from 'react-router';
import { LayoutDashboard, Package, PlusCircle, ClipboardList, CreditCard, Bot, Clock, Megaphone, Sparkles, Coins, Store } from 'lucide-react';
import { requireMe } from '~/lib/api.server';
import { dateFr } from '~/lib/format';

export async function loader({ request }: any) { return requireMe(request); }

const GROUPS: [string, [string, string, any, boolean?][]][] = [
  ['Ma Boutique', [['/ma-boutique', 'Tableau De Bord', LayoutDashboard, true], ['/ma-boutique/annonces', 'Mes Annonces', Package, true], ['/ma-boutique/annonces/nouvelle', 'Poser Une Annonce', PlusCircle, true], ['/ma-boutique/commandes', 'Commandes Reçues', ClipboardList]]],
  ['Visibilité', [['/ma-boutique/visibilite', 'Campagnes Et Mise En Avant', Megaphone]]],
  ['SM-IA', [['/ma-boutique/sm-ia', 'Assistant SM-IA', Sparkles, true], ['/ma-boutique/sm-ia/commandes', 'SM-IA Commandes', Bot], ['/ma-boutique/sm-ia/recharger', 'Recharger Mes Crédits', Coins]]],
  ['Compte', [['/ma-boutique/abonnement', 'Abonnement', CreditCard]]],
];

export default function SellerLayout() {
  const me = useLoaderData<typeof loader>();
  const sub = me.shop?.subscription;
  const daysLeft = sub ? Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 864e5) : 0;
  return (
    <div className="container-x py-6 grid md:grid-cols-[250px_1fr] gap-6">
      <aside className="space-y-3 md:sticky md:top-36 h-fit">
        <div className="card p-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="size-10 rounded-xl bg-orange text-white flex items-center justify-center"><Store className="size-5" /></span>
            <div className="min-w-0"><p className="text-xs text-muted">Ma Boutique</p><p className="font-display font-semibold text-indigo truncate">{me.shop?.name || 'À créer'}</p></div>
          </div>
          {me.shop && (sub
            ? <p className={`text-xs mt-2 flex items-center gap-1 ${daysLeft <= 7 ? 'text-orange-dark' : 'text-turquoise'}`}><Clock className="size-3" />{sub.kind === 'trial' ? 'Essai' : 'Abonnement'} : {daysLeft} j (jusqu’au {dateFr(sub.endsAt)})</p>
            : <p className="text-xs mt-2 text-red-700">Abonnement expiré : annonces masquées</p>)}
          {me.shop && (
            <Link prefetch="intent" to="/ma-boutique/sm-ia" className="mt-3 flex items-center justify-between rounded-xl bg-indigo text-white px-3 py-2 text-xs hover:bg-indigo/90">
              <span className="flex items-center gap-1.5"><Coins className="size-3.5" />Crédits SM-IA</span><b>{(me.credits || 0).toLocaleString('fr-FR')}</b>
            </Link>
          )}
        </div>
        {me.shop && (
          <nav className="card p-2 flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            {GROUPS.map(([g, items]) => (
              <div key={g} className="contents md:block">
                <p className="hidden md:block px-3 pt-2 pb-1 text-[11px] font-semibold text-muted">{g}</p>
                {items.map(([to, label, Icon, end]) => (
                  <NavLink prefetch="intent" key={to} to={to} end={!!end} viewTransition className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-indigo text-white' : 'text-ink/80 hover:bg-sable'}`}>
                    <Icon className="size-4" />{label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        )}
      </aside>
      <div className="min-w-0"><Outlet /></div>
    </div>
  );
}
