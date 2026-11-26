import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useLoaderData, useRouteError, Link, useNavigation, useLocation } from 'react-router';
import type { ShouldRevalidateFunctionArgs } from 'react-router';
import type { LinksFunction } from 'react-router';
import './app.css';
import { getMe } from './lib/api.server';
import { getCategories } from './lib/catalog.server';
import { Header, Footer, TabBar } from './components/Shell';
import { NavProgress, PageSpinner, useBusyButtons, useRevealOnScroll } from './components/motion';
import { InstallPrompt, PWA_HEAD_SCRIPT, useServiceWorker } from './components/Pwa';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'manifest', href: '/manifest.webmanifest' },
  { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
];

// Écran d'accueil : affiché à chaque ouverture ou actualisation (rendu serveur, avant le chargement du code),
// jamais lors des changements de page. Styles et script en ligne pour apparaître dès le premier octet.
const SPLASH_CSS = `
#splash{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;background:#FFF7EC;transition:opacity .45s ease,visibility .45s}
html:not(.js) #splash,html.splash-done #splash{display:none}
html.splash-out #splash{opacity:0;visibility:hidden}
html.splash-lock{overflow:hidden}
#splash .sp-icon{width:84px;height:84px;border-radius:22px;box-shadow:0 18px 40px -18px rgb(27 42 107/.55);animation:sp-pop .6s cubic-bezier(.2,.8,.2,1.2) both}
#splash .sp-logo{font:700 26px/1.2 Poppins,ui-sans-serif,system-ui,sans-serif;color:#1B2A6B;letter-spacing:-.01em;animation:sp-up .5s .15s cubic-bezier(.2,.7,.2,1) both}
#splash .sp-logo b{color:#C94310}
#splash .sp-msg{font:500 14px/1.5 Inter,ui-sans-serif,system-ui,sans-serif;color:#5E6482;max-width:300px;animation:sp-up .5s .3s cubic-bezier(.2,.7,.2,1) both}
#splash .sp-spin{margin-top:10px;width:28px;height:28px;border-radius:50%;border:3px solid #DCE0F0;border-top-color:#C94310;animation:spin .7s linear infinite}
@keyframes sp-pop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
@keyframes sp-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#splash *{animation-duration:.01ms!important}}
`;
const SPLASH_JS = `
(function(){var d=document.documentElement,t0=Date.now(),done=false;d.classList.add('splash-lock');
function end(){if(done)return;done=true;d.classList.add('splash-out');d.classList.remove('splash-lock');
setTimeout(function(){d.classList.add('splash-done');dispatchEvent(new Event('sunu:splash-done'));},450);}
function hide(){setTimeout(end,Math.max(0,1400-(Date.now()-t0)));}
if(document.readyState==='complete')hide();else addEventListener('load',hide);
setTimeout(end,5000);})();
`;

export async function loader({ request }: { request: Request }) {
  const [me, cats] = await Promise.all([getMe(request), getCategories()]);
  return { me, cats };
}

// Le profil et le menu ne sont rechargés qu'après une action (formulaire) ou en ouvrant
// SM-Chat et les notifications : une requête de moins à chaque changement de page.
export function shouldRevalidate({ formMethod, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  if (formMethod && formMethod !== 'GET') return defaultShouldRevalidate;
  return /^\/(messages|notifications|connexion|deconnexion|verification|compte|ma-boutique\/sm-chat)/.test(nextUrl.pathname);
}

const BARE = /^\/(ma-boutique|admin|connexion|inscription|verification|mot-de-passe-oublie)(\/|$)/;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1B2A6B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Sunu-Market" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script dangerouslySetInnerHTML={{ __html: PWA_HEAD_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />
      </head>
      <body>
        <div id="splash" role="status" aria-label="Chargement de Sunu-Market">
          <img className="sp-icon" src="/icons/icon-192.png" alt="" width={84} height={84} />
          <div className="sp-logo"><b>&lt;</b>Sunu-Market<b>/&gt;</b></div>
          <p className="sp-msg">Bienvenue ! Le centre commercial en ligne de Dakar s’ouvre pour vous…</p>
          <div className="sp-spin" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_JS }} />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { me, cats } = useLoaderData<typeof loader>();
  useRevealOnScroll();
  useBusyButtons();
  useServiceWorker();
  const nav = useNavigation();
  const loading = nav.state === 'loading' && !nav.formMethod;
  const path = useLocation().pathname;
  // Espaces « application » (commerçant, administration) et écrans d'inscription : pleine page, sans en-tête ni pied du site
  if (BARE.test(path)) return (<><NavProgress /><Outlet /></>);
  return (
    <>
      <NavProgress />
      <PageSpinner />
      <InstallPrompt />
      <Header me={me} cats={cats} />
      <main className={`min-h-[60vh] transition-opacity duration-200 ${loading ? 'opacity-60 delay-150' : 'opacity-100'}`} aria-busy={loading}><Outlet /></main>
      <Footer />
      <TabBar me={me} />
    </>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const msg = isRouteErrorResponse(error) ? (typeof error.data === 'string' ? error.data : error.statusText) : 'Une erreur inattendue est survenue.';
  return (
    <main className="container-x py-20 text-center">
      <p className="font-display text-6xl font-bold text-orange">{status}</p>
      <h1 className="font-display text-2xl font-bold text-indigo mt-4">{status === 404 ? 'Page Introuvable' : 'Un Problème Est Survenu'}</h1>
      <p className="text-muted mt-2">{status === 404 ? 'Cette page n’existe pas ou a été retirée.' : msg}</p>
      <Link prefetch="intent" to="/" className="btn-primary mt-6">Retour À L’Accueil</Link>
    </main>
  );
}
