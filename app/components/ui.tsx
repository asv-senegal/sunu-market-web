import { Link } from 'react-router';
import { BadgeCheck, Megaphone, MapPin } from 'lucide-react';
import { fcfa, img, CONDITION } from '~/lib/format';

export function ListingCard({ l, i = 0, className = '' }: { l: any; i?: number; className?: string }) {
  return (
    <Link prefetch="intent" to={`/a/${l.id}`} viewTransition className={`group block ${className}`} data-reveal="" style={{ '--d': `${Math.min(i, 8) * 60}ms` } as React.CSSProperties}>
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-sable-dark">
        <img src={img(l.photo)} alt={l.title} loading="lazy" decoding="async" className="size-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out" style={{ viewTransitionName: `photo-${l.id}` }} />
        <span className="absolute inset-0 bg-gradient-to-t from-indigo/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {l.featured && <span className="chip absolute top-2 left-2 bg-indigo text-white"><Megaphone className="size-3" />Mis En Avant</span>}
        {l.promo_price_fcfa != null && <span className="chip absolute top-2 right-2 bg-orange text-white">Promo</span>}
      </div>
      <div className="mt-2 px-0.5">
        <p className="font-display font-semibold text-ink">
          {l.promo_price_fcfa != null ? <><span className="text-orange">{fcfa(l.promo_price_fcfa)}</span> <s className="text-xs text-muted font-normal">{fcfa(l.price_fcfa)}</s></> : fcfa(l.price_fcfa)}
        </p>
        <p className="text-sm text-ink/80 line-clamp-1">{l.title}</p>
        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
          <BadgeCheck className="size-3.5 text-turquoise shrink-0" /><span className="truncate">{l.shop_name}</span>
          {l.quarter && <><span>·</span><MapPin className="size-3 shrink-0" /><span className="truncate">{l.quarter}</span></>}
        </p>
        {l.condition && <p className="text-[11px] text-muted">{CONDITION[l.condition]}</p>}
      </div>
    </Link>
  );
}

// Publicité payante, toujours signalée comme telle
export function AdBanner({ ads }: { ads: any[] }) {
  if (!ads?.length) return null;
  const a = ads[0];
  return (
    <a href={`/pub/${a.id}`} className="relative block overflow-hidden rounded-2xl lift" data-reveal="zoom">
      <img src={a.image_url} alt="" className="h-28 md:h-36 w-full object-cover" loading="lazy" decoding="async" />
      <span className="absolute inset-0 bg-gradient-to-r from-indigo/85 to-transparent" />
      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white max-w-[70%]">
        <span className="chip bg-white/20 text-white text-[10px]">Publicité</span>
        <span className="block font-display font-semibold text-lg md:text-xl mt-1">{a.title}</span>
        <span className="text-xs text-white/80">{a.shop_name}</span>
      </span>
    </a>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">{children}</div>;
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'info' | 'success'; children: React.ReactNode }) {
  const c = { error: 'bg-red-50 text-red-800 border-red-200', info: 'bg-indigo-50 text-indigo border-indigo-100', success: 'bg-turquoise-50 text-turquoise border-turquoise/20' }[tone];
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}

export function Field({ label, name, error, hint, children, ...p }: any) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children || <input name={name} className="input" aria-invalid={!!error} {...p} />}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{[].concat(error)[0]}</span>}
    </label>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-display font-semibold text-indigo text-lg">{title}</p>
      {text && <p className="text-sm text-muted mt-1 max-w-md mx-auto">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink animate-fade-up">{title}</h1>
        {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Chip({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`chip ${cls}`}>{children}</span>;
}

// Bascule segmentée (maquette « .seg ») : liens ou boutons, un seul actif
export function Seg({ items, className = '' }: { items: { label: React.ReactNode; to?: string; on: boolean; onClick?: () => void }[]; className?: string }) {
  return (
    <div className={`inline-flex bg-sable-2 rounded-xl p-1 gap-0.5 ${className}`}>
      {items.map((it, i) => {
        const cls = `h-[34px] px-3.5 rounded-[9px] flex items-center justify-center gap-1.5 text-[13px] whitespace-nowrap transition-all ${it.on ? 'bg-white text-ink font-semibold shadow-sm' : 'text-ink-2 font-medium hover:text-ink'}`;
        return it.to ? <Link key={i} prefetch="intent" to={it.to} className={cls} aria-current={it.on ? 'page' : undefined}>{it.label}</Link>
          : <button key={i} type="button" onClick={it.onClick} className={cls} aria-pressed={it.on}>{it.label}</button>;
      })}
    </div>
  );
}

// Filtres en pastilles (maquette : « Toutes », « En Cours »…)
export function TabChips({ items }: { items: { label: React.ReactNode; to: string; on: boolean }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {items.map((it, i) => <Link key={i} prefetch="intent" to={it.to} className={`tabchip ${it.on ? '!bg-indigo !text-white !border-indigo font-semibold' : ''}`} aria-current={it.on ? 'page' : undefined}>{it.label}</Link>)}
    </div>
  );
}

// Ligne d'outils sous la barre haute des espaces Ma Boutique et Administrateur (le titre est dans la barre haute)
export function Toolbar({ sub, children }: { sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      {sub ? <p className="text-[13px] text-muted max-w-3xl">{sub}</p> : <span />}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
