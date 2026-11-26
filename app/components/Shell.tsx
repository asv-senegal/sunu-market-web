import { Form, Link, NavLink, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import {
  Shirt, User, Baby, Armchair, Smartphone, HandHeart, Store, ShoppingBasket, BookOpen, Dumbbell, Car, Shapes,
  Search, Plus, House, MessageCircle, Bell, Menu, ChevronRight, Star, Heart, MapPin, CircleHelp, ChevronDown, BadgeCheck, ShoppingBag, ShieldCheck, Lock, LogOut,
} from 'lucide-react';
import { Brand } from './Brand';

export const CAT_ICON: Record<string, any> = {
  shirt: Shirt, user: User, baby: Baby, armchair: Armchair, smartphone: Smartphone, 'hand-heart': HandHeart, store: Store,
  'shopping-basket': ShoppingBasket, 'book-open': BookOpen, dumbbell: Dumbbell, car: Car, shapes: Shapes,
};
// Photo d'illustration de chaque catégorie (Pexels)
export const CAT_IMG: Record<string, string> = {
  femmes: 'print_dress', hommes: 'man_phone', enfants: 'kids_clothes', 'maison-et-bureau': 'living_room', electronique: 'phone_table',
  artisanat: 'basket_close', boutiques: 'artisan_stall', supermarche: 'supermarket2', 'livres-et-loisirs': 'books_stack',
  'sports-et-sante': 'football', voitures: 'cars_parked', 'autres-categories': 'baskets_angola',
};

export type Cat = { id: number; slug: string; name: string; icon: string; is_shops: boolean; subs: { id: number; slug: string; name: string; items: string[] }[] };

export const catHref = (c: Cat, sub?: string) => (c.is_shops ? `/boutiques${sub ? '?vue=' + sub : ''}` : `/c/${c.slug}${sub ? '/' + sub : ''}`);

export function Logo({ light = false, to = '/', className = 'text-xl' }: { light?: boolean; to?: string; className?: string }) {
  return (
    <Link prefetch="intent" to={to} className={`font-display font-bold tracking-tight whitespace-nowrap ${className} ${light ? 'text-white' : 'text-indigo'}`} aria-label="Sunu-Market, accueil">
      <span className="text-orange">&lt;</span>Sunu-Market<span className="text-orange">/&gt;</span>
    </Link>
  );
}

// Pages de l'espace membre : en-tête sans barre de catégories (maquette P12 à P19)
export const isAccountPath = (p: string) => /^\/(compte|commandes|notifications|signalements|signaler|messages|profil|paiement)(\/|$)/.test(p);
const STAFF = ['admin', 'moderator', 'finance', 'support'];

export function Header({ me, cats }: { me: any; cats: Cat[] }) {
  const loc = useLocation();
  const q = new URLSearchParams(loc.search).get('q') || '';
  const account = isAccountPath(loc.pathname);
  // En-tête qui se resserre et prend une ombre au défilement
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 12); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line transition-shadow duration-300 ${scrolled ? 'shadow-[0_8px_24px_-14px_rgb(27_42_107/0.35)]' : ''}`}>
      <div className={`container-x flex items-center gap-3 md:gap-7 transition-[height] duration-300 ${scrolled ? 'h-14 md:h-16' : 'h-16 md:h-[72px]'}`}>
        <Link prefetch="intent" to="/categories" className="md:hidden -ml-1 p-2 text-indigo" aria-label="Catégories"><Menu className="size-6" /></Link>
        <Logo />
        <Form action="/recherche" className="hidden md:flex flex-1 max-w-[620px] h-[46px] items-center rounded-full border-[1.5px] border-line bg-white pl-4 pr-1.5 focus-within:border-turquoise transition-colors" role="search">
          <Search className="size-[19px] text-muted shrink-0" />
          <input name="q" defaultValue={q} placeholder="Rechercher un article, une boutique…" className="flex-1 min-w-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted" aria-label="Rechercher" />
          <span className="flex items-center gap-1.5 px-3.5 border-l border-line text-[13.5px] font-medium text-ink whitespace-nowrap" title="Ville : Dakar (d’autres villes suivront)">
            <MapPin className="size-4" />Dakar
          </span>
          <button className="size-9 rounded-full bg-orange text-white flex items-center justify-center hover:bg-orange-dark transition-colors shrink-0" aria-label="Lancer la recherche"><Search className="size-[17px]" strokeWidth={2.2} /></button>
        </Form>
        <div className="ml-auto flex items-center gap-1 md:gap-4 text-ink-2">
          {me ? (
            <>
              <NavIcon to="/compte/favoris" label="Favoris" className="hidden md:inline-flex"><Heart className="size-[21px]" /></NavIcon>
              <NavIcon to="/messages" label="SM-Chat" count={me.unread?.messages}><MessageCircle className="size-[21px]" /></NavIcon>
              <NavIcon to="/notifications" label="Notifications" count={me.unread?.notifications}><Bell className="size-[21px]" /></NavIcon>
              <UserMenu me={me} />
            </>
          ) : (
            <>
              <NavIcon to="/pages/faq" label="Aide" className="hidden md:inline-flex"><CircleHelp className="size-5" /></NavIcon>
              <div className="hidden md:flex items-center h-[38px] px-3.5 rounded-[10px] border-[1.5px] border-line text-[13.5px] font-medium text-ink-2">
                <Link prefetch="intent" to="/inscription" className="hover:text-orange">S’inscrire</Link><span className="mx-1.5">|</span>
                <Link prefetch="intent" to="/connexion" className="hover:text-orange">Se Connecter</Link>
              </div>
              <Link prefetch="intent" to="/connexion" className="md:hidden btn-ghost btn-sm">Se Connecter</Link>
            </>
          )}
          <Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className="hidden md:inline-flex btn-primary h-10 shadow-[0_6px_16px_-8px_rgb(201_67_16/.7)]"><Plus className="size-4" strokeWidth={2.4} />Poser Une Annonce</Link>
        </div>
      </div>
      {!account && <CategoryBar cats={cats} />}
    </header>
  );
}

// Menu du compte (avatar + chevron) : profil, achats, boutique, administration, déconnexion
function UserMenu({ me }: { me: any }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  }, [open]);
  const ini = `${me.user.firstName[0]}${me.user.lastName[0]}`;
  const item = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-2 hover:bg-sable';
  return (
    <div className="relative hidden md:block">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-1.5 p-1 rounded-full hover:bg-sable" aria-label="Menu du compte">
        <span className="size-[34px] rounded-full bg-orange text-white flex items-center justify-center text-[13px] font-semibold">{ini}</span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2.2} />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-full mt-2 z-50 w-64 card p-2 shadow-xl animate-[dropdown_.16s_ease-out]">
            <div className="px-3 py-2 mb-1 border-b border-line">
              <p className="font-semibold text-ink text-sm">{me.user.firstName} {me.user.lastName}</p>
              {me.user.verificationStatus === 'verified' && <p className="text-xs text-turquoise flex items-center gap-1"><BadgeCheck className="size-3.5" />Compte Vérifié</p>}
            </div>
            <Link prefetch="intent" to="/compte" className={item} role="menuitem"><User className="size-4" />Mon Profil</Link>
            <Link prefetch="intent" to="/commandes" className={item} role="menuitem"><ShoppingBag className="size-4" />Mes Commandes</Link>
            <Link prefetch="intent" to="/ma-boutique" className={item} role="menuitem"><Store className="size-4" />Ma Boutique</Link>
            {STAFF.includes(me.user.role) && <Link prefetch="intent" to="/admin" className={item} role="menuitem"><ShieldCheck className="size-4" />Espace Administrateur</Link>}
            <Link prefetch="intent" to="/compte/securite" className={item} role="menuitem"><Lock className="size-4" />Sécurité Et Données</Link>
            <Form method="post" action="/deconnexion"><button className={`${item} w-full text-red-700`} role="menuitem"><LogOut className="size-4" />Se Déconnecter</button></Form>
          </div>
        </>
      )}
    </div>
  );
}

function NavIcon({ to, label, count, children, className = '' }: any) {
  return (
    <Link prefetch="intent" to={to} className={`relative p-2 rounded-full text-ink-2 hover:bg-sable hover:text-indigo transition-colors ${className}`} aria-label={label}>
      {children}
      {count > 0 && <span className="absolute top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">{count > 9 ? '9+' : count}</span>}
    </Link>
  );
}

// Barre des 12 catégories, menu déroulant au survol (modèle Vinted)
function CategoryBar({ cats }: { cats: Cat[] }) {
  // Catégorie dont le menu vient d'être utilisé : il reste fermé tant que la souris ne quitte pas l'onglet,
  // sinon le survol (ou le focus du lien cliqué) le rouvrirait au-dessus de la page de destination.
  const [shut, setShut] = useState<string | null>(null);
  // Les photos des menus ne sont chargées qu'au premier survol de la barre (12 images de moins par page)
  const [armed, setArmed] = useState(false);
  const close = (slug: string) => (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('a')) return;
    setShut(slug);
    (document.activeElement as HTMLElement | null)?.blur();
  };
  return (
    <nav className="hidden md:block border-t border-line/70" aria-label="Catégories" onMouseEnter={() => setArmed(true)} onFocus={() => setArmed(true)}>
      <ul className="container-x flex justify-between gap-x-5 overflow-x-auto lg:overflow-x-visible [scrollbar-width:none]">
        {cats.map((c) => (
          <li key={c.slug} className="group" onClick={close(c.slug)} onMouseLeave={() => shut === c.slug && setShut(null)}>
            <Link prefetch="intent" to={catHref(c)} className="block py-2.5 text-[13px] font-medium text-ink/80 border-b-2 border-transparent group-hover:text-orange group-hover:border-orange whitespace-nowrap">
              {c.name}
            </Link>
            {c.subs.length > 0 && <MegaMenu cat={c} shut={shut === c.slug} armed={armed} />}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MegaMenu({ cat, shut, armed }: { cat: Cat; shut: boolean; armed: boolean }) {
  const Icon = CAT_ICON[cat.icon] || Shapes;
  const open = shut
    ? 'pointer-events-none'
    : 'group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0';
  return (
    <div data-megamenu={cat.slug} className={`invisible opacity-0 -translate-y-2 ${open} transition duration-200 delay-75 absolute left-0 right-0 top-full bg-white border-t border-sable-dark shadow-xl`}>
      <div className="container-x grid grid-cols-[1fr_260px] gap-8 py-6 min-h-[300px]">
        <div>
          <Link prefetch="intent" to={catHref(cat)} className="inline-flex items-center gap-2 font-display font-semibold text-indigo mb-4">
            <Icon className="size-5 text-turquoise" />Tout Voir : {cat.name}<ChevronRight className="size-4" />
          </Link>
          <ul className="columns-3 gap-8">
            {cat.subs.map((s, i) => (
              <li key={s.slug} className="break-inside-avoid mb-4 mm-item" style={{ animationDelay: `${60 + i * 25}ms` }}>
                <Link prefetch="intent" to={catHref(cat, s.slug)} className="font-semibold text-sm text-ink hover:text-orange">{s.name}</Link>
                {!cat.is_shops && (
                  <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">{s.items.slice(0, 5).join(', ')}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
        <Link prefetch="intent" to={catHref(cat)} className="relative rounded-2xl overflow-hidden block">
          {armed && <img src={`/demo/${CAT_IMG[cat.slug]}.jpg`} alt="" className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-[1200ms]" loading="lazy" decoding="async" />}
          <span className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-indigo/90 to-transparent text-white font-display font-semibold">{cat.name}</span>
        </Link>
      </div>
    </div>
  );
}

// Barre d'onglets Android
export function TabBar({ me }: { me: any }) {
  const tab = 'flex flex-col items-center gap-0.5 text-[11px] font-medium py-1.5 flex-1';
  const cls = ({ isActive }: any) => `${tab} ${isActive ? 'text-orange' : 'text-muted'}`;
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-sable-dark flex items-center pb-[env(safe-area-inset-bottom)]" aria-label="Navigation principale">
      <NavLink prefetch="intent" to="/" end className={cls}><House className="size-5" />Accueil</NavLink>
      <NavLink prefetch="intent" to="/recherche" className={cls}><Search className="size-5" />Rechercher</NavLink>
      <Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className={tab} aria-label="Poser Une Annonce">
        <span className="size-11 -mt-5 rounded-full bg-orange text-white flex items-center justify-center shadow-lg"><Plus className="size-6" /></span>
      </Link>
      <NavLink prefetch="intent" to="/messages" className={cls}>
        <span className="relative"><MessageCircle className="size-5" />{me?.unread?.messages > 0 && <span className="absolute -top-1 -right-2 size-2.5 rounded-full bg-orange" />}</span>SM-Chat
      </NavLink>
      <NavLink prefetch="intent" to={me ? '/compte' : '/connexion'} className={cls}><User className="size-5" />Profil</NavLink>
    </nav>
  );
}

const FOOT: [string, [string, string][]][] = [
  ['Sunu-Market', [['À Propos De Nous', '/pages/a-propos'], ['Espace Membre', '/compte'], ['Devenir Partenaire', '/pages/devenir-partenaire'], ['Devenir Investisseur', '/pages/devenir-investisseur'], ['Programme De Parrainage', '/pages/parrainage']]],
  ['Bon À Savoir', [['Comment Ça Marche', '/pages/comment-ca-marche'], ['Abonnement', '/pages/abonnement'], ['Poser Une Annonce', '/ma-boutique/annonces/nouvelle'], ['Lancer Une Campagne', '/pages/campagnes'], ['Mettre Un Produit En Avant', '/pages/mise-en-avant']]],
  ['Ressources', [['Foire Aux Questions', '/pages/faq'], ['Formation', '/pages/formation'], ['Tutoriels', '/pages/tutoriels'], ['Démos', '/pages/demos'], ['Documentation', '/pages/documentation']]],
  // Applications sœurs : liens externes [à confirmer]
  ['Sunu-App', [['Sunu-Link', ''], ['Sunu-Kilo', ''], ['Sunu-House', ''], ['Sunu-Eat', ''], ['Sunu-Baobab', '']]],
];
// Exemples fictifs en attendant le flux d'avis réel
const REVIEWS = [
  ['Awa, Médina', 'J’ai vendu mes tenues en une semaine, et tout s’est réglé dans SM-Chat.'],
  ['Moussa, Parcelles', 'Les comptes vérifiés me rassurent avant d’acheter.'],
  ['Fatou, Sacré-Cœur', 'Ma boutique est simple à gérer depuis mon téléphone.'],
  ['Ibrahima, Grand Yoff', 'Mes paniers sont vus par des clients de tout Dakar.'],
];
const SOCIAL = ['facebook', 'instagram', 'linkedin', 'youtube', 'whatsapp'];

export function Footer() {
  return (
    <footer className="bg-indigo text-white/85 mt-16 pb-20 md:pb-0">
      <div className="container-x py-12 grid gap-10 md:grid-cols-4">
        {FOOT.map(([title, links]) => (
          <div key={title}>
            <h2 className="font-display text-white font-semibold mb-4">{title}</h2>
            <ul className="space-y-2.5 text-sm">
              {links.map(([l, href]) => (
                <li key={l}>{href ? <Link prefetch="intent" to={href} className="hover:text-white hover:underline">{l}</Link>
                  : <span className="text-white/60" title="Lien à venir">{l}</span>}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x py-8 border-t border-white/10 grid gap-8 lg:grid-cols-[auto_1fr_auto] items-center">
        <div className="flex flex-wrap justify-center lg:justify-start gap-3" aria-label="Réseaux sociaux">
          {SOCIAL.map((s) => (
            <span key={s} className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" title={`${s} (lien à venir)`}>
              <Brand name={s} className="size-[18px] text-white" />
            </span>
          ))}
        </div>
        <div className="h-28 lg:h-12 overflow-hidden relative min-w-0" aria-label="Avis de membres (exemples)">
          <ul className="animate-[ticker_16s_linear_infinite] motion-reduce:animate-none">
            {[...REVIEWS, REVIEWS[0]].map(([who, txt], i) => (
              <li key={i} className="h-28 lg:h-12 flex flex-col lg:flex-row items-center justify-center gap-1.5 lg:gap-2 px-2 text-sm text-center">
                <span className="flex shrink-0 text-orange">{[0, 1, 2, 3, 4].map((k) => <Star key={k} className="size-3.5 fill-current" />)}</span>
                <span className="max-w-sm lg:max-w-none lg:truncate">« {txt} »</span><span className="shrink-0 text-xs lg:text-sm text-white/60">{who}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap justify-center lg:justify-start gap-2">
          {[['apple', 'App Store'], ['googleplay', 'Google Play']].map(([b, l]) => (
            <span key={b} className="flex items-center gap-2 rounded-xl border border-white/25 px-3 py-1.5">
              <Brand name={b} className="size-5 text-white" />
              <span className="leading-tight"><span className="block text-[10px] text-orange-50/80">Bientôt Disponible</span><span className="text-sm font-semibold text-white">{l}</span></span>
            </span>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65">
          {[['Confidentialité', 'confidentialite'], ['Cookies', 'cookies'], ['Conditions', 'conditions'], ['Témoignages', 'temoignages'], ['Soutenir', 'soutenir']].map(([l, s]) => (
            <Link prefetch="intent" key={s} to={`/pages/${s}`} className="hover:text-white">{l}</Link>
          ))}
          <span className="md:ml-auto">© 2026 Sunu-Market. Tous droits réservés.</span>
        </div>
      </div>
    </footer>
  );
}
