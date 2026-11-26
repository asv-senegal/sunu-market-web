// Recherche de la barre haute : comptes, commandes, annonces, signalements, paiements (selon les droits)
import { Link, useLoaderData } from 'react-router';
import { Search, User, ShoppingBag, Package, Flag, Wallet } from 'lucide-react';
import { api } from '~/lib/api.server';
import { fcfa, ORDER_STATUS, REPORT_REASON } from '~/lib/format';
import { Empty } from '~/components/ui';

export const handle = { title: 'Recherche' };
export async function loader({ request }: any) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 2) return { q, res: null, error: q ? 'Tapez au moins 2 caractères.' : null };
  const r = await api(request, `/admin/search?q=${encodeURIComponent(q)}`);
  return { q, res: r.ok ? r.data : null, error: r.ok ? null : r.data?.error };
}
const VS: Record<string, string> = { verified: 'Vérifié', pending: 'En attente', unverified: 'Non vérifié', rejected: 'Refusé' };

export default function AdminSearch() {
  const { q, res, error } = useLoaderData<typeof loader>();
  const groups: [string, any, any[], (x: any) => [string, string, string]][] = res ? [
    ['Comptes', User, res.users || [], (x) => [`${x.first_name} ${x.last_name}`, `${x.phone} · ${x.quarter || 'Dakar'} · ${VS[x.verification_status]}${x.status === 'suspended' ? ' · suspendu' : ''}`, `/admin/journal?q=${x.id}`]],
    ['Commandes', ShoppingBag, res.orders || [], (x) => [`${x.ref} · ${x.title_snapshot}`, `${fcfa(x.total_fcfa)} · ${ORDER_STATUS[x.status]?.label}`, `/admin/journal?q=${x.id}`]],
    ['Annonces', Package, res.listings || [], (x) => [x.title, `${x.shop_name} · ${x.status}`, `/a/${x.id}`]],
    ['Signalements', Flag, res.reports || [], (x) => [`${x.ref} · ${REPORT_REASON[x.reason] || x.reason}`, x.status === 'open' ? 'Ouvert' : 'Traité', `/admin/signalements/${x.id}`]],
    ['Paiements', Wallet, res.payments || [], (x) => [`${x.ref} · ${x.purpose}`, `${fcfa(x.total_fcfa)} · ${x.status}`, `/admin/revenus?q=${x.ref}`]],
  ] : [];
  const total = groups.reduce((a, g) => a + g[2].length, 0);
  return (
    <div className="space-y-4 max-w-4xl">
      <form className="md:hidden flex gap-2"><input name="q" defaultValue={q} className="input" placeholder="Rechercher un compte, un ID…" /><button className="btn-indigo"><Search className="size-4" /></button></form>
      {error && <p className="text-sm text-muted">{error}</p>}
      {res && <p className="text-sm text-muted">{total} résultat{total > 1 ? 's' : ''} pour « {q} ». Chaque recherche est inscrite au journal d’audit.</p>}
      {res && !total && <Empty title="Aucun Résultat" text="Essayez un nom, un numéro, une référence (SM-, SR-, AB-) ou un identifiant." />}
      {groups.filter((g) => g[2].length).map(([t, Icon, items, row]) => (
        <section key={t} className="card overflow-hidden" data-reveal="">
          <h2 className="font-display font-semibold text-ink px-5 pt-4 pb-2 flex items-center gap-2"><Icon className="size-4 text-turquoise" />{t}<span className="chip bg-sable-2 text-ink-2">{items.length}</span></h2>
          <ul className="divide-y divide-line">
            {items.map((x: any) => { const [a, b, to] = row(x); return (
              <li key={x.id}><Link prefetch="intent" to={to} className="block px-5 py-3 hover:bg-sable/60"><p className="text-sm font-semibold">{a}</p><p className="text-xs text-muted">{b}</p></Link></li>
            ); })}
          </ul>
        </section>
      ))}
    </div>
  );
}
