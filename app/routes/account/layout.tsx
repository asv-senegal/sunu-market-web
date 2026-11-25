// Espace membre (P13 à P19) : barre latérale « Mon Profil, Mes Commandes, Ma Boutique… » à gauche, contenu à droite
import { NavLink, Outlet, useLoaderData, useLocation } from 'react-router';
import { User, ShoppingBag, Store, MessageCircle, Heart, Bell, Flag, CreditCard, Lock, BadgeCheck, Gift } from 'lucide-react';
import { requireMe } from '~/lib/api.server';

export async function loader({ request }: any) { return requireMe(request, { verified: false }); }

export const ACCOUNT_NAV: [string, string, any, boolean?][] = [
  ['/compte', 'Mon Profil', User, true], ['/commandes', 'Mes Commandes', ShoppingBag], ['/ma-boutique', 'Ma Boutique', Store],
  ['/messages', 'SM-Chat', MessageCircle], ['/compte/favoris', 'Favoris', Heart], ['/notifications', 'Notifications', Bell],
  ['/signalements', 'Signalements', Flag], ['/ma-boutique/abonnement', 'Abonnement', CreditCard], ['/compte/securite', 'Sécurité Et Données', Lock],
];

export function Avatar({ me, size = 48 }: { me: any; size?: number }) {
  return <span className="rounded-full bg-orange text-white font-semibold flex items-center justify-center shrink-0" style={{ width: size, height: size, fontSize: size * 0.36 }}>{me.user.firstName[0]}{me.user.lastName[0]}</span>;
}

export default function AccountLayout() {
  const me = useLoaderData<typeof loader>();
  const path = useLocation().pathname;
  const sub = me.shop?.subscription;
  const daysLeft = sub ? Math.max(0, Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 864e5)) : 0;
  // « Signaler un problème » est rattaché à Signalements, le détail d'une commande à Mes Commandes
  const active = (to: string, end?: boolean) => end ? path === to : path === to || path.startsWith(to + '/') || (to === '/signalements' && path === '/signaler');
  return (
    <div className="container-x py-6 md:py-7 flex gap-9">
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col gap-[3px] sticky top-24 h-fit">
        <div className="flex items-center gap-3 px-1.5 pb-3.5">
          <Avatar me={me} />
          <div className="min-w-0">
            <p className="font-semibold text-[15px] text-ink truncate">{me.user.firstName} {me.user.lastName}</p>
            {me.user.verificationStatus === 'verified'
              ? <p className="text-xs text-turquoise font-medium flex items-center gap-1"><BadgeCheck className="size-3.5" />Compte Vérifié</p>
              : <p className="text-xs text-orange font-medium">Vérification en attente</p>}
          </div>
        </div>
        {ACCOUNT_NAV.map(([to, label, Icon, end]) => {
          const on = active(to, end);
          return (
            <NavLink key={to} to={to} end={end} prefetch="intent" viewTransition aria-current={on ? 'page' : undefined}
              className={`flex items-center gap-3 h-[42px] px-3.5 rounded-xl text-sm transition-colors ${on ? 'bg-white text-orange font-semibold shadow-[0_2px_10px_-4px_rgb(27_42_107/.18)]' : 'text-ink-2 font-medium hover:bg-white/60'}`}>
              <Icon className="size-[19px]" strokeWidth={1.8} />{label}
            </NavLink>
          );
        })}
        {sub?.kind === 'trial' && (
          <span className="mt-3 flex items-center gap-1.5 w-fit rounded-full bg-[#FDF3D7] text-[#8A5A00] px-3 py-1 text-xs font-semibold"><Gift className="size-3.5" />Essai : {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</span>
        )}
      </aside>
      <div className="flex-1 min-w-0 flex flex-col gap-[18px]"><Outlet /></div>
    </div>
  );
}
