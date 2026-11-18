// Liste déroulante de Sunu-Market : remplace le <select> natif, impossible à styler de façon homogène.
// - Accessible : rôles combobox/listbox, flèches, Entrée, Échap, Début/Fin, recherche par première lettre.
// - Compatible formulaires : champ caché `name`, `required` validé par le navigateur, `autoSubmit` pour les filtres.
// - Contrôlé (value + onChange) ou non contrôlé (defaultValue).
// - S'ouvre vers le haut s'il manque de place ; en panneau du bas sur téléphone.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

export type Option = { value: string; label: string; hint?: string; disabled?: boolean };
type Props = {
  name?: string;
  options: Option[] | string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoSubmit?: boolean;
  searchable?: boolean;
  size?: 'md' | 'sm';
  className?: string;
  id?: string;
  'aria-label'?: string;
};

const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Select({ name, options, value, defaultValue, onChange, placeholder = 'Choisir…', required, disabled, autoSubmit, searchable, size = 'md', className = '', id, ...rest }: Props) {
  const opts: Option[] = useMemo(() => (options as any[]).map((o) => (typeof o === 'string' ? { value: o, label: o } : o)), [options]);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? '');
  const current = controlled ? value! : inner;
  const selected = opts.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [up, setUp] = useState(false);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const [desktop, setDesktop] = useState(true);
  const panel = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const auto = useId();
  const listId = `${id || auto}-list`;
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const typed = useRef({ s: '', t: 0 });
  const showSearch = searchable ?? opts.length > 10;
  const shown = q ? opts.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : opts;

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return;
    const f = (e: MouseEvent | TouchEvent) => { const t = e.target as Node; if (!root.current?.contains(t) && !panel.current?.contains(t)) setOpen(false); };
    document.addEventListener('mousedown', f); document.addEventListener('touchstart', f);
    return () => { document.removeEventListener('mousedown', f); document.removeEventListener('touchstart', f); };
  }, [open]);

  // Le panneau est rendu au niveau de la page (portail) : aucune animation ou transformation d'un parent
  // ne peut le décaler. Sa position suit le bouton au défilement et au redimensionnement.
  useIso(() => {
    if (!open) return;
    const place = () => {
      if (!btn.current) return;
      const r = btn.current.getBoundingClientRect();
      const isUp = window.innerHeight - r.bottom < 280 && r.top > window.innerHeight - r.bottom;
      setUp(isUp);
      setDesktop(window.matchMedia('(min-width: 640px)').matches);
      setPos(isUp ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 6 } : { left: r.left, width: r.width, top: r.bottom + 6 });
    };
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);

  // Option sélectionnée visible à l'ouverture
  useIso(() => {
    if (!open || !btn.current) return;
    const i = Math.max(0, shown.findIndex((o) => o.value === current));
    setActive(i);
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' }));
  }, [open]);

  const choose = (o: Option) => {
    if (o.disabled) return;
    if (!controlled) setInner(o.value);
    onChange?.(o.value);
    setOpen(false); setQ('');
    btn.current?.focus();
    if (autoSubmit) setTimeout(() => hidden.current?.form?.requestSubmit(), 0);
  };

  const move = (d: number) => {
    if (!shown.length) return;
    let i = active;
    for (let k = 0; k < shown.length; k++) { i = (i + d + shown.length) % shown.length; if (!shown[i].disabled) break; }
    setActive(i);
    list.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(shown.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) choose(shown[active]); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); setQ(''); }
    else if (!showSearch && e.key.length === 1) {
      // Recherche par premières lettres
      const now = Date.now(); typed.current = { s: (now - typed.current.t < 600 ? typed.current.s : '') + e.key.toLowerCase(), t: now };
      const i = shown.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.s));
      if (i >= 0) { setActive(i); list.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' }); }
    }
  };

  const h = size === 'sm' ? 'h-9 text-xs' : 'h-11 text-sm';
  return (
    <div ref={root} className={`relative ${className}`} onKeyDown={onKey}>
      <button ref={btn} id={id} type="button" disabled={disabled} role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
        aria-label={rest['aria-label']} onClick={() => setOpen((o) => !o)}
        className={`w-full ${h} rounded-xl border bg-white pl-3 pr-9 text-left flex items-center transition-[border-color,box-shadow] duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${open ? 'border-turquoise ring-4 ring-turquoise/15' : 'border-sable-dark hover:border-indigo/30'}`}>
        <span className={`truncate ${selected ? 'text-ink' : 'text-muted/80'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`absolute right-3 size-4 text-muted transition-transform duration-200 ${open ? 'rotate-180 text-turquoise' : ''}`} />
      </button>
      {/* Valeur envoyée avec le formulaire ; reste « focusable » pour la validation required du navigateur */}
      <input ref={hidden} name={name} value={current} required={required} tabIndex={-1} aria-hidden="true" onChange={() => {}}
        onInvalid={() => setTimeout(() => { btn.current?.focus(); btn.current?.scrollIntoView({ block: "center", behavior: "smooth" }); }, 0)} className="absolute bottom-0 left-4 size-px opacity-0 pointer-events-none" />
      {open && pos && typeof document !== 'undefined' && createPortal(
        <>
          {!desktop && <div className="fixed inset-0 z-[70] bg-indigo/30 animate-[fade-in_.15s_ease-out]" onClick={() => setOpen(false)} aria-hidden="true" />}
          <div ref={panel} onKeyDown={onKey} style={desktop ? { left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom } : undefined}
            className={`fixed z-[71] bg-white border border-sable-dark shadow-[0_18px_40px_-16px_rgb(27_42_107/0.35)] overflow-hidden
            ${desktop ? `rounded-xl ${up ? 'origin-bottom' : 'origin-top'} animate-[dropdown_.16s_cubic-bezier(.2,.8,.2,1)_both]`
              : 'inset-x-0 bottom-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)] animate-[slide-up-sheet_.28s_cubic-bezier(.2,.8,.2,1)_both]'}`}>
            {!desktop && <div className="mx-auto mt-2.5 mb-1 h-1 w-10 rounded-full bg-sable-dark" aria-hidden="true" />}
            {showSearch && (
              <div className="p-2 border-b border-sable-dark relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted" />
                <input autoFocus={desktop} value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} placeholder="Rechercher…" aria-label="Filtrer la liste"
                  className="w-full h-9 rounded-lg bg-sable pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-turquoise/30" />
              </div>
            )}
            <ul ref={list} id={listId} role="listbox" aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              className={`${desktop ? 'max-h-64' : 'max-h-[55vh]'} overflow-y-auto overscroll-contain p-1.5`}>
              {shown.length === 0 && <li className="px-3 py-2.5 text-sm text-muted">Aucun résultat</li>}
              {shown.map((o, i) => {
                const sel = o.value === current;
                return (
                  <li key={o.value + i} id={`${listId}-${i}`} data-i={i} role="option" aria-selected={sel} aria-disabled={o.disabled}
                    onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(o)}
                    className={`flex items-center gap-2 rounded-lg px-3 ${desktop ? 'py-2' : 'py-3'} text-sm cursor-pointer select-none transition-colors duration-100
                      ${o.disabled ? 'opacity-40 cursor-not-allowed' : ''} ${i === active ? 'bg-indigo-50 text-indigo' : 'text-ink'} ${sel ? 'font-semibold' : ''}`}>
                    <span className="flex-1 min-w-0"><span className="block truncate">{o.label}</span>{o.hint && <span className="block text-xs text-muted truncate">{o.hint}</span>}</span>
                    {sel && <Check className="size-4 text-turquoise shrink-0 animate-pop" />}
                  </li>
                );
              })}
            </ul>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
