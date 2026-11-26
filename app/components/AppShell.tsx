// Coque « application » pleine page des espaces Ma Boutique (P20 à P28) et Administrateur (P29 à P36) :
// barre latérale fixe à gauche, barre haute avec le titre de la page, recherche, cloche et avatar.
import { Form, NavLink, useLocation, useMatches } from 'react-router';
import { useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';

export type ShellItem = { to: string; label: string; icon: any; badge?: number | null; end?: boolean };
export type ShellGroup = { title: string; items: ShellItem[] };

// Titre affiché dans la barre haute : `handle.title` de la route la plus profonde
export function usePageTitle(fallback: string) {
  const matches = useMatches() as any[];
  for (let i = matches.length - 1; i >= 0; i--) {
    const h = matches[i].handle;
    if (h?.title) return typeof h.title === 'function' ? h.title(matches[i].data) : h.title;
  }
  return fallback;
}

export function AppShell({ dark = false, brand, top, groups, foot, title, search, actions, children }: {
  dark?: boolean; brand: React.ReactNode; top?: React.ReactNode; groups: ShellGroup[]; foot?: React.ReactNode;
  title: string; search: { action: string; placeholder: string; name?: string }; actions?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', f);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', f); document.body.style.overflow = ''; };
  }, [open]);
  const q = new URLSearchParams(loc.search).get(search.name || 'q') || '';

  const side = (
    <>
      <div className="px-2.5 pb-3.5 flex items-center justify-between">{brand}
        <button className={`lg:hidden p-2 -mr-2 ${dark ? 'text-white' : 'text-indigo'}`} onClick={() => setOpen(false)} aria-label="Fermer le menu"><X className="size-5" /></button>
      </div>
      {top}
      <nav aria-label="Menu de l’espace" className="flex flex-col">
        {groups.map((g) => (
          <div key={g.title}>
            <p className={`text-[11.5px] font-semibold mx-3 mt-5 mb-2 ${dark ? 'text-[#7C86B3]' : 'text-[#9AA0B8]'}`}>{g.title}</p>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} prefetch="intent" viewTransition
                className={({ isActive }) => `flex items-center gap-3 min-h-[42px] px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                  dark ? (isActive ? 'bg-white/10 text-white font-semibold' : 'text-[#C9CFE6] hover:bg-white/5 hover:text-white')
                       : (isActive ? 'bg-orange-50 text-orange-dark font-semibold' : 'text-ink-2 hover:bg-sable')}`}>
                <it.icon className="size-[19px] shrink-0" strokeWidth={1.8} />
                <span className="flex-1 leading-tight">{it.label}</span>
                {!!it.badge && <span className="min-w-[22px] h-5 px-1.5 rounded-full bg-orange text-white text-[11.5px] font-bold flex items-center justify-center">{it.badge > 99 ? '99+' : it.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="flex-1 min-h-6" />
      {foot}
    </>
  );
  const asideCls = `flex flex-col w-[248px] shrink-0 px-4 py-[22px] overflow-y-auto no-scrollbar ${dark ? 'bg-indigo-900 text-[#C9CFE6]' : 'bg-white border-r border-line'}`;

  return (
    <div className={`min-h-dvh flex ${dark ? 'bg-admin' : 'bg-sable'}`}>
      <aside className={`hidden lg:flex sticky top-0 h-dvh ${asideCls}`}>{side}</aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button className="absolute inset-0 bg-ink/40 animate-[fade-in_.2s]" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
          <aside className={`relative h-full shadow-2xl animate-[slide-in-left_.24s_cubic-bezier(.2,.7,.2,1)] ${asideCls}`}>{side}</aside>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-14 md:h-[68px] bg-white/95 backdrop-blur border-b border-line flex items-center gap-3 md:gap-[18px] px-4 md:px-8">
          <button className="lg:hidden p-2 -ml-2 text-indigo" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open}><Menu className="size-6" /></button>
          <h1 className="font-display text-lg md:text-[21px] font-semibold text-ink truncate" style={{ viewTransitionName: 'shell-title' }}>{title}</h1>
          <Form action={search.action} className="hidden md:flex ml-auto h-10 w-[300px] rounded-[10px] bg-sable items-center gap-2 px-3 focus-within:ring-2 focus-within:ring-turquoise/40" role="search">
            <Search className="size-4 text-muted shrink-0" />
            <input name={search.name || 'q'} defaultValue={q} placeholder={search.placeholder} aria-label={search.placeholder} className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-muted" />
          </Form>
          <div className="ml-auto md:ml-0 flex items-center gap-2 md:gap-3">{actions}</div>
        </header>
        <main className="flex-1 px-4 md:px-8 py-5 md:py-[26px] pb-24 lg:pb-10 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
