// Application installable (PWA) : enregistrement du service worker et fenêtre d'installation.
import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X } from 'lucide-react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
declare global { interface Window { __bip?: BIPEvent | null } }

// Script placé dans <head> : l'événement d'installation peut arriver avant que React ne démarre.
export const PWA_HEAD_SCRIPT = `
window.__bip=null;
addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;dispatchEvent(new Event('sunu:bip'));});
addEventListener('appinstalled',function(){window.__bip=null;dispatchEvent(new Event('sunu:installed'));});
`;

export function useServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const reg = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (document.readyState === 'complete') reg(); else window.addEventListener('load', reg, { once: true });
  }, []);
}

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMacSafari = () => /Macintosh/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Firefox/.test(navigator.userAgent) && navigator.maxTouchPoints <= 1;

// Proposée à chaque ouverture ou actualisation du site (jamais dans l'application déjà installée),
// une fois l'écran d'accueil terminé.
export function InstallPrompt() {
  const [mode, setMode] = useState<null | 'native' | 'ios' | 'mac'>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const decide = () => {
      if (window.__bip) setMode('native');
      else if (isIOS()) setMode('ios');
      else if (isMacSafari()) setMode('mac');
    };
    const onBip = () => setMode('native');
    const onInstalled = () => { setOpen(false); setMode(null); };
    window.addEventListener('sunu:bip', onBip);
    window.addEventListener('sunu:installed', onInstalled);
    // Après l'écran d'accueil ; Chrome peut annoncer l'installation un peu plus tard, on lui laisse 4 s
    const afterSplash = () => { decide(); setOpen(true); timer = setTimeout(decide, 4000); };
    if (document.documentElement.classList.contains('splash-done')) afterSplash();
    else window.addEventListener('sunu:splash-done', afterSplash, { once: true });
    return () => {
      window.removeEventListener('sunu:bip', onBip);
      window.removeEventListener('sunu:installed', onInstalled);
      window.removeEventListener('sunu:splash-done', afterSplash);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open || !mode) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, mode]);

  if (!open || !mode) return null;

  const install = async () => {
    const e = window.__bip;
    if (!e) return;
    await e.prompt();
    await e.userChoice.catch(() => null);
    window.__bip = null;
    setOpen(false);
  };

  return (
    <div className="fixed z-[80] inset-x-3 bottom-20 md:bottom-6 md:left-auto md:right-6 md:w-[380px] animate-[install-in_.35s_cubic-bezier(.2,.8,.2,1)_both]"
      role="dialog" aria-modal="false" aria-labelledby="install-title">
      <div className="rounded-2xl bg-white shadow-2xl border border-sable-dark p-4">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" alt="" className="size-12 rounded-xl shrink-0" loading="eager" decoding="async" />
          <div className="min-w-0 flex-1">
            <p id="install-title" className="font-display font-semibold text-indigo">Installer Sunu-Market</p>
            <p className="text-sm text-muted mt-0.5">Ouvrez la boutique en un geste depuis votre écran d’accueil, plein écran et plus rapide.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="-mr-1 -mt-1 p-1.5 rounded-full text-muted hover:bg-sable" aria-label="Fermer"><X className="size-4" /></button>
        </div>
        {mode === 'native' && (
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={install} className="btn-primary flex-1"><Download className="size-4" />Installer</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Plus Tard</button>
          </div>
        )}
        {mode === 'ios' && (
          <ol className="mt-3 space-y-2 text-sm text-ink">
            <li className="flex items-center gap-2"><span className="size-6 rounded-full bg-indigo-50 text-indigo text-xs font-bold flex items-center justify-center">1</span>Touchez <Share className="size-4 text-indigo" aria-label="Partager" /> en bas de Safari</li>
            <li className="flex items-center gap-2"><span className="size-6 rounded-full bg-indigo-50 text-indigo text-xs font-bold flex items-center justify-center">2</span>Choisissez <SquarePlus className="size-4 text-indigo" /> « Sur l’écran d’accueil »</li>
          </ol>
        )}
        {mode === 'mac' && (
          <p className="mt-3 text-sm text-ink">Dans Safari, ouvrez le menu <b>Fichier</b> puis <b>Ajouter au Dock</b>.</p>
        )}
      </div>
    </div>
  );
}
