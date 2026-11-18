// Effets visuels : apparition au défilement, compteurs animés, carrousels, barre de progression
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigation, Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Observe tous les éléments [data-reveal] de la page et les révèle à l'entrée dans l'écran
export function useRevealOnScroll() {
  const loc = useLocation();
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-visible')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px 8% 0px', threshold: 0.01 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [loc.pathname, loc.search]);
}

export const stagger = (i: number, step = 70) => ({ 'data-reveal': '', style: { '--d': `${Math.min(i, 8) * step}ms` } as React.CSSProperties });

// Nombre qui défile jusqu'à sa valeur quand il devient visible
export function CountUp({ value, format = (n: number) => n.toLocaleString('fr-FR').replace(/ /g, ' '), duration = 900 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [n, setN] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(value); return; }
    setN(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => { const p = Math.min(1, (t - t0) / duration); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{format(n)}</span>;
}

// Barre fine en haut de l'écran pendant les chargements de page
export function NavProgress() {
  const nav = useNavigation();
  if (nav.state === 'idle') return null;
  return <div className="fixed top-0 inset-x-0 z-[60] h-0.5"><div className="nav-progress h-full bg-orange" /></div>;
}

// Rangée défilante horizontale avec flèches (accroche magnétique)
export function Carousel({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const update = () => { const el = ref.current; if (el) setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 }); };
  useEffect(() => { update(); }, []);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <div className="relative group/car" role="region" aria-label={label}>
      <div ref={ref} onScroll={update} className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {children}
      </div>
      {!edges.start && <button onClick={() => go(-1)} aria-label="Précédent" className="hidden md:flex absolute -left-4 top-1/3 size-10 rounded-full bg-white shadow-lg items-center justify-center text-indigo opacity-0 group-hover/car:opacity-100 transition-opacity"><ChevronLeft className="size-5" /></button>}
      {!edges.end && <button onClick={() => go(1)} aria-label="Suivant" className="hidden md:flex absolute -right-4 top-1/3 size-10 rounded-full bg-white shadow-lg items-center justify-center text-indigo opacity-0 group-hover/car:opacity-100 transition-opacity"><ChevronRight className="size-5" /></button>}
    </div>
  );
}

// Carrousel principal de l'accueil : fondu enchaîné, zoom lent, défilement automatique, glisser au doigt
export type Slide = { img: string; kicker: string; title: string; text: string; cta: string; to: string; tone?: string };
export function HeroSlider({ slides, children }: { slides: Slide[]; children?: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setI((i + 1) % slides.length), 6500);
    return () => clearTimeout(t);
  }, [i, paused, slides.length]);
  const go = (n: number) => setI((n + slides.length) % slides.length);
  return (
    <section className="relative overflow-hidden rounded-3xl bg-indigo text-white h-[440px] md:h-[540px]" aria-roledescription="carrousel" aria-label="À la une"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); touch.current = null; }}>
      {slides.map((s, k) => (
        <div key={s.title} className={`absolute inset-0 transition-opacity duration-1000 ${k === i ? 'opacity-100 z-10' : 'opacity-0'}`} aria-hidden={k !== i} role="group" aria-roledescription="diapositive" aria-label={`${k + 1} sur ${slides.length}`}>
          <img src={s.img} alt="" className={`absolute inset-0 size-full object-cover ${k === i ? 'kenburns' : ''}`} loading={k ? 'lazy' : 'eager'} />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo via-indigo/85 md:via-indigo/70 to-indigo/10" />
          <div className="relative h-full flex flex-col justify-center md:justify-start p-7 md:px-12 md:pt-12 max-w-xl">
            {k === i && (
              <>
                <p className="chip bg-white/15 text-white w-fit animate-fade-up">{s.kicker}</p>
                <h2 className="font-display text-3xl md:text-[2.6rem] font-bold leading-tight mt-4 animate-fade-up" style={{ animationDelay: '80ms' }}>{s.title}</h2>
                <p className="mt-4 text-white/85 animate-fade-up" style={{ animationDelay: '160ms' }}>{s.text}</p>
                <Link prefetch="intent" to={s.to} className="btn-primary w-fit mt-6 press animate-fade-up" style={{ animationDelay: '240ms' }} tabIndex={k === i ? 0 : -1}>{s.cta}</Link>
              </>
            )}
          </div>
        </div>
      ))}
      {children && <div className="hidden md:block absolute z-20 left-12 bottom-14 w-[440px]">{children}</div>}
      <div className="absolute z-20 bottom-5 left-7 md:left-12 flex items-center gap-2">
        {slides.map((s, k) => (
          <button key={s.title} onClick={() => go(k)} aria-label={`Diapositive ${k + 1}`} aria-current={k === i}
            className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? 'w-8 bg-orange' : 'w-3 bg-white/50 hover:bg-white'}`} />
        ))}
      </div>
      <div className="absolute z-20 bottom-3 right-4 hidden md:flex gap-2">
        <button onClick={() => go(i - 1)} aria-label="Précédent" className="size-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"><ChevronLeft className="size-5" /></button>
        <button onClick={() => go(i + 1)} aria-label="Suivant" className="size-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"><ChevronRight className="size-5" /></button>
      </div>
    </section>
  );
}

// Anneau de progression (solde de crédits, essai)
export function Ring({ value, max, size = 96, stroke = 9, color = 'var(--color-turquoise)', children }: { value: number; max: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const [p, setP] = useState(0);
  useEffect(() => { const t = setTimeout(() => setP(Math.max(0, Math.min(1, max ? value / max : 0))), 60); return () => clearTimeout(t); }, [value, max]);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-white/15" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
