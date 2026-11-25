// Espace « Ma Boutique » (P20 à P28) : application pleine page, barre latérale de la maquette v3
import { Link, Outlet, useLoaderData } from 'react-router';
import {
  LineChart, Package, ListChecks, MessageCircle, Star, Megaphone, Sparkles, Bot, Coins, CreditCard, Settings, Bell, BadgeCheck, Gift, Store,
} from 'lucide-react';
import { requireMe } from '~/lib/api.server';
import { img } from '~/lib/format';
import { AppShell, usePageTitle, type ShellGroup } from '~/components/AppShell';
import { Logo, TabBar } from '~/components/Shell';

export async function loader({ request }: any) { return requireMe(request); }

export default function SellerLayout() {
  const me = useLoaderData<typeof loader>();
  const title = usePageTitle('Ma Boutique');
  const sub = me.shop?.subscription;
  const daysLeft = sub ? Math.max(0, Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 864e5)) : 0;
  const ini = `${me.user.firstName[0]}${me.user.lastName[0]}`;

  const groups: ShellGroup[] = me.shop ? [
    { title: 'Ma Boutique', items: [
      { to: '/ma-boutique', label: 'Tableau De Bord', icon: LineChart, end: true },
      { to: '/ma-boutique/annonces', label: 'Mes Annonces', icon: Package },
      { to: '/ma-boutique/commandes', label: 'Commandes', icon: ListChecks, badge: me.unread?.seller_orders },
      { to: '/ma-boutique/sm-chat', label: 'SM-Chat', icon: MessageCircle, badge: me.unread?.messages },
      { to: '/ma-boutique/avis', label: 'Avis Clients', icon: Star },
    ] },
    { title: 'Visibilité', items: [{ to: '/ma-boutique/visibilite', label: 'Campagnes Et Mise En Avant', icon: Megaphone }] },
    { title: 'SM-IA', items: [
      { to: '/ma-boutique/sm-ia', label: 'Assistant SM-IA', icon: Sparkles, end: true },
      { to: '/ma-boutique/sm-ia/commandes', label: 'SM-IA Commandes', icon: Bot },
      { to: '/ma-boutique/sm-ia/recharger', label: 'Crédits SM-IA', icon: Coins },
    ] },
    { title: 'Compte', items: [
      { to: '/ma-boutique/abonnement', label: 'Abonnement', icon: CreditCard },
      { to: '/ma-boutique/parametres', label: 'Paramètres', icon: Settings },
    ] },
  ] : [{ title: 'Ma Boutique', items: [{ to: '/ma-boutique', label: 'Créer Ma Boutique', icon: Store, end: true }] }];

  const top = (
    <>
      {/* Bascule entre le rôle d'acheteur et celui de vendeur : un seul compte, deux rôles */}
      <div className="flex bg-sable-2 rounded-xl p-1 gap-0.5 mb-3" role="tablist" aria-label="Rôle">
        <Link prefetch="intent" to="/commandes" role="tab" aria-selected="false" className="flex-1 h-[34px] rounded-[9px] flex items-center justify-center text-[13px] font-medium text-ink-2 hover:text-ink">Mes Achats</Link>
        <span role="tab" aria-selected="true" className="flex-1 h-[34px] rounded-[9px] flex items-center justify-center text-[13px] font-semibold text-ink bg-white shadow-sm">Ma Boutique</span>
      </div>
      {me.shop && (
        <Link prefetch="intent" to={`/b/${me.shop.slug}`} className="flex gap-2.5 items-center p-3 rounded-[14px] bg-sable hover:bg-sable-2 transition-colors" title="Voir ma boutique publique">
          {me.shop.banner
            ? <img src={img(me.shop.banner)} alt="" className="size-[42px] rounded-[11px] object-cover shrink-0" />
            : <span className="size-[42px] rounded-[11px] bg-orange text-white flex items-center justify-center shrink-0"><Store className="size-5" /></span>}
          <div className="min-w-0">
            <p className="font-semibold text-[13.5px] text-ink truncate">{me.shop.name}</p>
            {me.user.verificationStatus === 'verified' && <p className="text-[11.5px] text-turquoise font-medium flex items-center gap-1"><BadgeCheck className="size-3" />Compte Vérifié</p>}
          </div>
        </Link>
      )}
    </>
  );

  const foot = me.shop && (
    <div className="space-y-2">
      {sub?.kind === 'trial' && (
        <Link prefetch="intent" to="/ma-boutique/abonnement" className="flex items-center gap-1.5 w-fit rounded-full bg-[#FDF3D7] text-[#8A5A00] px-3 py-1 text-xs font-semibold"><Gift className="size-3.5" />Essai : {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</Link>
      )}
      {!sub && <Link prefetch="intent" to="/ma-boutique/abonnement" className="block rounded-xl bg-red-50 text-red-800 px-3 py-2 text-xs font-semibold">Abonnement expiré : boutique hors ligne</Link>}
      <Link prefetch="intent" to="/ma-boutique/sm-ia/recharger" className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 text-xs text-ink hover:bg-indigo-100 transition-colors">
        <Coins className="size-4" strokeWidth={2} /><span className="flex-1">Crédits SM-IA</span><b>{(me.credits || 0).toLocaleString('fr-FR')}</b>
      </Link>
    </div>
  );

  const actions = (
    <>
      <Link prefetch="intent" to="/notifications" className="relative p-2 rounded-full text-ink-2 hover:bg-sable" aria-label="Notifications">
        <Bell className="size-[21px]" />
        {me.unread?.notifications > 0 && <span className="absolute top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">{me.unread.notifications}</span>}
      </Link>
      <Link prefetch="intent" to="/compte" className="size-9 rounded-full bg-orange text-white text-[13px] font-semibold flex items-center justify-center" aria-label="Mon Profil">{ini}</Link>
    </>
  );

  return (
    <>
      <AppShell brand={<Logo className="text-lg" />} top={top} groups={groups} foot={foot} title={title}
        search={{ action: '/ma-boutique/annonces', placeholder: 'Rechercher une commande, une annonce…' }} actions={actions}>
        <Outlet />
      </AppShell>
      <TabBar me={me} />
    </>
  );
}
