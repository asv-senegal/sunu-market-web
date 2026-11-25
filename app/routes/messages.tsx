// SM-Chat : liste des conversations
import { Link, NavLink, Outlet, useLoaderData, useLocation, useParams } from 'react-router';
import { BadgeCheck } from 'lucide-react';
import { MessageCircle, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { apiOrThrow, requireMe } from '~/lib/api.server';
import { fcfa, timeFr } from '~/lib/format';

export const meta = () => [{ title: 'SM-Chat | Sunu-Market' }];
export const handle = { title: 'SM-Chat' };
const TONES = ['bg-indigo', 'bg-orange', 'bg-turquoise', 'bg-[#2A3B85]'];
export const initials = (n = '') => n.replace(/[^\p{L} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export async function loader({ request }: any) {
  await requireMe(request);
  return apiOrThrow(request, '/conversations');
}

// Heure si aujourd'hui, « Hier », sinon la date courte
const when = (d: string) => { const t = new Date(d); const days = Math.floor((Date.now() - t.getTime()) / 864e5);
  return days < 1 && new Date().getDate() === t.getDate() ? timeFr(d) : days < 2 ? 'Hier' : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Africa/Dakar' }).format(t); };

export default function Messages() {
  const { items } = useLoaderData<typeof loader>();
  const { id } = useParams();
  const [q, setQ] = useState('');
  // Dans l'espace Ma Boutique, SM-Chat n'affiche que les échanges avec les clients de la boutique
  const seller = useLocation().pathname.startsWith('/ma-boutique');
  const base = seller ? '/ma-boutique/sm-chat' : '/messages';
  const list = items.filter((c: any) => (!seller || c.i_am_seller) && (!q || `${c.other_name} ${c.listing_title}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className={seller ? '' : 'container-x py-4 md:py-6'}>
      <div className={`grid md:grid-cols-[300px_1fr] gap-4 min-h-[480px] ${seller ? 'h-[calc(100dvh-8rem)] md:h-[calc(100dvh-7.5rem)]' : 'h-[calc(100dvh-9rem)] md:h-[calc(100dvh-8.5rem)]'}`}>
        <aside className={`card shadow-sm overflow-hidden flex flex-col min-h-0 ${id ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 pb-3 space-y-3">
            {!seller && <h1 className="font-display text-xl font-semibold text-ink">SM-Chat</h1>}
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" className="input h-10 pl-9 rounded-xl bg-sable border-transparent" aria-label="Rechercher une conversation" /></div>
          </div>
          <ul className="overflow-y-auto flex-1 pb-2">
            {list.length === 0 && <li className="p-6 text-sm text-muted text-center">{seller ? 'Aucun échange avec vos clients pour l’instant.' : 'Aucune conversation. Écrivez à un commerçant depuis une annonce.'}</li>}
            {list.map((c: any, i: number) => (
              <li key={c.id} className="px-2">
                <NavLink prefetch="intent" to={`${base}/${c.id}`} className={({ isActive }) => `flex gap-3 p-3 rounded-xl transition-colors ${isActive ? 'bg-sable' : 'hover:bg-sable/60'}`}>
                  <span className={`size-11 rounded-full ${TONES[i % TONES.length]} text-white text-sm font-semibold flex items-center justify-center shrink-0`}>{initials(c.other_name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex justify-between gap-2 items-baseline"><span className="font-semibold text-sm truncate flex items-center gap-1">{c.other_name}{!c.i_am_seller && <BadgeCheck className="size-3.5 text-turquoise shrink-0" />}</span><span className="text-[11px] text-muted whitespace-nowrap">{when(c.last_message_at)}</span></p>
                    <p className={`text-xs truncate mt-0.5 ${c.unread ? 'font-semibold text-ink' : 'text-muted'}`}>{c.last_body || `${c.listing_title} · ${fcfa(c.price_fcfa)}`}</p>
                  </div>
                  {c.unread > 0 && <span className="self-center size-5 rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>
        <section className={`card shadow-sm overflow-hidden min-h-0 ${id ? 'flex' : 'hidden md:flex'} flex-col`}>
          {id ? <Outlet /> : (
            <div className="m-auto text-center text-muted p-6">
              <MessageCircle className="size-10 mx-auto text-sable-dark" />
              <p className="mt-2 text-sm">Choisissez une conversation.</p>
              <Link prefetch="intent" to="/recherche" className="btn-ghost btn-sm mt-4">Parcourir Les Articles</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
