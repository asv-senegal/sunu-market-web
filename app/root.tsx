import { Links, Meta, Outlet, Scripts, ScrollRestoration, isRouteErrorResponse, useLoaderData, useRouteError, Link, useNavigation } from 'react-router';
import type { ShouldRevalidateFunctionArgs } from 'react-router';
import type { LinksFunction } from 'react-router';
import './app.css';
import { getMe } from './lib/api.server';
import { getCategories } from './lib/catalog.server';
import { Header, Footer, TabBar } from './components/Shell';
import { NavProgress, useRevealOnScroll } from './components/motion';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
];

export async function loader({ request }: { request: Request }) {
  const [me, cats] = await Promise.all([getMe(request), getCategories()]);
  return { me, cats };
}

// Le profil et le menu ne sont rechargés qu'après une action (formulaire) ou en ouvrant
// SM-Chat et les notifications : une requête de moins à chaque changement de page.
export function shouldRevalidate({ formMethod, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  if (formMethod && formMethod !== 'GET') return defaultShouldRevalidate;
  return /^\/(messages|notifications|connexion|deconnexion|verification)/.test(nextUrl.pathname);
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1B2A6B" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
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
  const nav = useNavigation();
  const loading = nav.state === 'loading' && !nav.formMethod;
  return (
    <>
      <NavProgress />
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
