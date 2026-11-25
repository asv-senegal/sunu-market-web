// Cadre plein écran des écrans de connexion et d'inscription (P07 à P10) : photo à gauche, formulaire à droite
import { Link } from 'react-router';
import { useRef, useState } from 'react';
import { Check, Eye, EyeOff, Lock } from 'lucide-react';

const STEPS = ['Vos Informations', 'Vérification Obligatoire', 'Validation'];

export function AuthFrame({ title, sub, step, image = 'man_phone_park', caption, children }: {
  title: string; sub?: string; step?: number; image?: string; caption?: string; children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex bg-sable">
      <div className="hidden lg:block relative w-[41.5%] shrink-0 overflow-hidden">
        <img src={`/demo/${image}.jpg`} alt="" className="absolute inset-0 size-full object-cover kenburns" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/10 to-transparent" />
        <Link to="/" className="absolute top-7 left-7 bg-white rounded-xl px-3 py-1.5 shadow-lg font-display font-bold text-lg text-indigo" aria-label="Sunu-Market, accueil">
          <span className="text-orange">&lt;</span>Sunu-Market<span className="text-orange">/&gt;</span>
        </Link>
        {caption && <p className="absolute bottom-10 left-8 right-10 text-white font-display text-[26px] font-semibold leading-tight animate-fade-up">{caption}</p>}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden px-5 pt-5"><Link to="/" className="font-display font-bold text-xl text-indigo"><span className="text-orange">&lt;</span>Sunu-Market<span className="text-orange">/&gt;</span></Link></div>
        <main className="flex-1 flex items-center justify-center px-5 py-8 md:py-12">
          <div className="w-full max-w-[420px] animate-fade-up">
            {step && <Stepper step={step} />}
            <h1 className="font-display text-[26px] md:text-[30px] font-semibold text-ink leading-tight">{title}</h1>
            {sub && <p className="text-sm text-muted mt-1.5 mb-6">{sub}</p>}
            {!sub && <div className="mb-6" />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 mb-7" aria-label={`Étape ${step} sur 3`}>
      {STEPS.map((l, i) => {
        const n = i + 1, done = n < step, on = n === step;
        return (
          <li key={l} className="flex items-center gap-2 flex-1 last:flex-none">
            <span className={`size-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${done ? 'bg-turquoise text-white' : on ? 'bg-orange text-white' : 'bg-sable-2 text-muted'}`}>{done ? <Check className="size-3.5" strokeWidth={3} /> : n}</span>
            <span className={`text-[11.5px] leading-tight ${on ? 'font-semibold text-ink' : 'text-muted'}`}>{l}</span>
            {n < 3 && <span className={`h-0.5 flex-1 min-w-3 rounded ${done ? 'bg-turquoise' : 'bg-line'}`} />}
          </li>
        );
      })}
    </ol>
  );
}

// Numéro sénégalais avec l'indicatif +221 affiché
export function PhoneField({ label = 'Numéro de téléphone', error, ...p }: any) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className={`flex items-center h-12 rounded-xl border bg-white focus-within:border-indigo focus-within:ring-2 focus-within:ring-indigo/15 transition ${error ? 'border-red-400' : 'border-line'}`}>
        <span className="pl-3.5 pr-3 text-sm font-medium text-ink border-r border-line">+221</span>
        <input type="tel" inputMode="tel" autoComplete="tel-national" placeholder="77 123 45 67" className="flex-1 min-w-0 h-full bg-transparent px-3 text-sm outline-none placeholder:text-muted/70" aria-invalid={!!error} {...p} />
      </span>
      {error && <span className="mt-1 block text-xs text-red-700">{[].concat(error)[0]}</span>}
    </label>
  );
}

export function PasswordField({ label = 'Mot de passe', error, hint, ...p }: any) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className={`flex items-center h-12 rounded-xl border bg-white focus-within:border-indigo focus-within:ring-2 focus-within:ring-indigo/15 transition ${error ? 'border-red-400' : 'border-line'}`}>
        <Lock className="size-4 text-muted ml-3.5" />
        <input type={show ? 'text' : 'password'} className="flex-1 min-w-0 h-full bg-transparent px-3 text-sm outline-none" aria-invalid={!!error} {...p} />
        <button type="button" onClick={() => setShow(!show)} className="px-3.5 text-muted hover:text-ink" aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
      </span>
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{[].concat(error)[0]}</span>}
    </label>
  );
}

// Code SMS à 6 chiffres en cases séparées (collage accepté) ; la valeur part dans un champ caché
export function OtpInput({ name = 'code', label = 'Code reçu par SMS', error, hint }: { name?: string; label?: string; error?: any; hint?: string }) {
  const [v, setV] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const set = (i: number, d: string) => {
    const digits = d.replace(/\D/g, '');
    if (digits.length > 1) { // collage du code complet
      const n = [...v]; digits.slice(0, 6 - i).split('').forEach((c, k) => { n[i + k] = c; }); setV(n);
      refs.current[Math.min(5, i + digits.length)]?.focus(); return;
    }
    const n = [...v]; n[i] = digits; setV(n);
    if (digits && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={v.join('')} />
      <div className="flex gap-2.5" role="group" aria-label={label}>
        {v.map((c, i) => (
          <input key={i} ref={(el) => { refs.current[i] = el; }} value={c} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={6}
            aria-label={`Chiffre ${i + 1}`} onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Backspace' && !c && i > 0) refs.current[i - 1]?.focus(); }}
            onFocus={(e) => e.target.select()}
            className={`size-12 rounded-xl border bg-white text-center font-display text-lg font-semibold outline-none transition focus:border-indigo focus:ring-2 focus:ring-indigo/15 ${error ? 'border-red-400' : 'border-line'}`} />
        ))}
      </div>
      {hint && !error && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-red-700">{[].concat(error)[0]}</span>}
    </div>
  );
}
