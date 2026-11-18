// SM-Chat : liste des conversations
import { Link, NavLink, Outlet, useLoaderData, useParams } from 'react-router';
import { MessageCircle, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { apiOrThrow, requireMe } from '~/lib/api.server';
import { ago, fcfa, img } from '~/lib/format';

export const meta = () => [{ title: 'SM-Chat | Sunu-Market' }];
export async function loader({ request }: any) {
  await requireMe(request);
  return apiOrThrow(request, '/conversations');
}

export default function Messages() {
  const { items } = useLoaderData<typeof loader>();
  const { id } = useParams();
  const [q, setQ] = useState('');
  const list = items.filter((c: any) => !q || `${c.other_name} ${c.listing_title}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="container-x py-4 md:py-6">
      <div className="card overflow-hidden grid md:grid-cols-[340px_1fr] h-[calc(100dvh-9rem)] md:h-[calc(100dvh-12rem)] min-h-[480px]">
        <aside className={`border-r border-sable-dark flex flex-col min-h-0 ${id ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-sable-dark space-y-3">
            <h1 className="font-display text-xl font-bold text-indigo">SM-Chat</h1>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" className="input h-9 pl-9 rounded-full bg-sable" aria-label="Rechercher une conversation" /></div>
          </div>
          <ul className="overflow-y-auto flex-1">
            {items.length === 0 && <li className="p-6 text-sm text-muted text-center">Aucune conversation. Écrivez à un commerçant depuis une annonce.</li>}
            {list.map((c: any) => (
              <li key={c.id}>
                <NavLink prefetch="intent" to={`/messages/${c.id}`} className={({ isActive }) => `flex gap-3 p-3 border-b border-sable-dark/60 ${isActive ? 'bg-indigo-50' : 'hover:bg-sable'}`}>
                  <img src={img(c.photo)} alt="" className="size-12 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="flex justify-between gap-2"><span className="font-semibold text-sm truncate">{c.other_name}</span><span className="text-[11px] text-muted whitespace-nowrap">{ago(c.last_message_at)}</span></p>
                    <p className="text-xs text-muted truncate">{c.listing_title} · {fcfa(c.price_fcfa)}</p>
                    <p className={`text-xs truncate ${c.unread ? 'font-semibold text-ink' : 'text-muted'}`}>{c.last_body}</p>
                  </div>
                  {c.unread > 0 && <span className="self-center size-5 rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>
        <section className={`min-h-0 ${id ? 'flex' : 'hidden md:flex'} flex-col`}>
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
