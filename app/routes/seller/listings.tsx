// P21 : Mes Annonces, filtres et suggestions SM-IA soumises à accord
import { Form, Link, useLoaderData, useSearchParams, useNavigation, useActionData } from 'react-router';
import { Megaphone, Sparkles, Check, X } from 'lucide-react';
import { api, apiOrThrow } from '~/lib/api.server';
import { fcfa, img } from '~/lib/format';
import { Alert, Empty, PageTitle } from '~/components/ui';
import { stagger } from '~/components/motion';

export const meta = () => [{ title: 'Mes Annonces | Sunu-Market' }];
export const loader = ({ request }: any) => apiOrThrow(request, '/me/shop/listings');
export async function action({ request }: any) {
  const f = await request.formData();
  const id = f.get('id'); const intent = f.get('intent');
  if (intent === 'delete') await api(request, `/listings/${id}`, { method: 'DELETE' });
  else if (intent === 'improve') { const r = await api(request, `/me/smia/listings/${id}/improve`, { method: 'POST' }); if (!r.ok) return { error: r.data.error }; return { info: r.data.action.status === 'done' ? 'SM-IA a mis à jour le texte (niveau Délégué Encadré).' : 'Proposition de SM-IA prête : validez-la ci-dessous.' }; }
  else if (intent === 'approve' || intent === 'reject') await api(request, `/me/smia/actions/${id}/${intent}`, { method: 'POST' });
  else { const r = await api(request, `/listings/${id}`, { method: 'PATCH', json: { status: f.get('status') } }); if (!r.ok) return { error: r.data.error }; }
  return null;
}
const ST: Record<string, [string, string]> = { active: ['En Ligne', 'bg-turquoise-50 text-turquoise'], paused: ['En Pause', 'bg-sable-dark text-muted'], sold: ['Vendue', 'bg-indigo-50 text-indigo'], draft: ['Brouillon', 'bg-orange-50 text-orange-dark'] };
const TABS: [string, string, (l: any) => boolean][] = [['toutes', 'Toutes', () => true], ['en-ligne', 'En Ligne', (l) => l.status === 'active'], ['stock-bas', 'Stock Bas', (l) => l.status === 'active' && l.stock <= 2], ['brouillons', 'Brouillons', (l) => l.status === 'draft']];

export default function MyListings() {
  const { items, pendingSuggestions } = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const [sp] = useSearchParams();
  const busy = useNavigation().state === 'submitting';
  const tab = TABS.find(([k]) => k === sp.get('vue')) || TABS[0];
  const list = items.filter(tab[2]);
  const byId = Object.fromEntries(items.map((l: any) => [l.id, l]));
  return (
    <>
      <PageTitle title="Mes Annonces" sub={`${items.length} annonce(s)`}><Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className="btn-primary press">Poser Une Annonce</Link></PageTitle>
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      {a?.info && <div className="mb-4"><Alert tone="success">{a.info}</Alert></div>}
      {pendingSuggestions.length > 0 && (
        <div className="space-y-3 mb-5">
          {pendingSuggestions.map((s: any) => (
            <div key={s.id} className="card p-4 border-turquoise/40 bg-turquoise-50/50 animate-fade-up">
              <p className="text-xs font-semibold text-turquoise flex items-center gap-1"><Sparkles className="size-3.5" />Suggestion De SM-IA · {byId[s.listing_id]?.title}</p>
              <p className="font-semibold mt-1">{s.payload.title}</p>
              <p className="text-sm text-muted line-clamp-3">{s.payload.description}</p>
              <Form method="post" className="flex gap-2 mt-3"><input type="hidden" name="id" value={s.id} />
                <button name="intent" value="approve" className="btn-indigo btn-sm"><Check className="size-3.5" />Appliquer</button>
                <button name="intent" value="reject" className="btn-ghost btn-sm"><X className="size-3.5" />Refuser</button>
              </Form>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {TABS.map(([k, l, fn]) => <Link prefetch="intent" key={k} to={`?vue=${k}`} className={`chip whitespace-nowrap py-1.5 px-3 ${tab[0] === k ? 'bg-indigo text-white' : 'bg-white border border-sable-dark'}`}>{l} ({items.filter(fn).length})</Link>)}
      </div>
      {list.length ? (
        <div className="card divide-y divide-sable-dark overflow-hidden">
          {list.map((l: any, i: number) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 p-3 hover:bg-sable/60 transition-colors" {...stagger(i, 40)}>
              <img src={img(l.photo)} alt="" className="size-14 rounded-xl object-cover" />
              <div className="flex-1 min-w-[180px]">
                <Link prefetch="intent" to={`/a/${l.id}`} className="font-medium text-sm hover:underline">{l.title}</Link>
                <p className="text-xs text-muted">{l.category} › {l.sub} · <span className={l.stock <= 2 ? 'text-orange-dark font-semibold' : ''}>Stock {l.stock}</span> · {l.views} vues</p>
              </div>
              <span className={`chip ${ST[l.status][1]}`}>{ST[l.status][0]}</span>
              {l.featured && <span className="chip bg-indigo text-white"><Megaphone className="size-3" />Mis En Avant</span>}
              <span className="font-semibold text-sm w-28 text-right">{fcfa(l.price_fcfa)}</span>
              <Form method="post" className="flex flex-wrap gap-1">
                <input type="hidden" name="id" value={l.id} />
                <button name="intent" value="improve" className="btn-ghost btn-sm text-turquoise" disabled={busy} title="Proposition soumise à votre accord, payée en crédits"><Sparkles className="size-3.5" />SM-IA</button>
                {l.status === 'active' && <button name="status" value="paused" className="btn-ghost btn-sm">Pause</button>}
                {l.status !== 'active' && <button name="status" value="active" className="btn-ghost btn-sm">{l.status === 'draft' ? 'Publier' : 'Remettre En Ligne'}</button>}
                {l.status === 'active' && <Link prefetch="intent" to={`/ma-boutique/visibilite?annonce=${l.id}`} className="btn-ghost btn-sm"><Megaphone className="size-3.5" /></Link>}
                {!['sold', 'draft'].includes(l.status) && <button name="status" value="sold" className="btn-ghost btn-sm">Vendue</button>}
                <button name="intent" value="delete" className="btn-ghost btn-sm text-red-700" onClick={(e) => { if (!confirm('Supprimer cette annonce ?')) e.preventDefault(); }}>Supprimer</button>
              </Form>
            </div>
          ))}
        </div>
      ) : <Empty title="Aucune Annonce Ici" text="Publiez un article : il apparaîtra dans le catalogue." action={<Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className="btn-primary">Poser Une Annonce</Link>} />}
    </>
  );
}
