// P21 : Mes Annonces, filtres et suggestions SM-IA soumises à accord
import { Form, Link, useLoaderData, useSearchParams, useNavigation, useActionData } from 'react-router';
import { Megaphone, Sparkles, Check, X, Plus, MoreHorizontal, Pause, Play, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api, apiOrThrow } from '~/lib/api.server';
import { fcfa, img } from '~/lib/format';
import { Alert, Empty, Seg } from '~/components/ui';
import { stagger } from '~/components/motion';

export const meta = () => [{ title: 'Mes Annonces | Sunu-Market' }];
export const handle = { title: 'Mes Annonces' };
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
const TABS: [string, string, (l: any) => boolean][] = [['toutes', 'Toutes', () => true], ['en-ligne', 'En Ligne', (l) => l.status === 'active'], ['stock-bas', 'Stock Bas', (l) => l.status === 'active' && l.stock <= 3], ['brouillons', 'Brouillons', (l) => l.status === 'draft']];

export default function MyListings() {
  const { items, pendingSuggestions } = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const [sp] = useSearchParams();
  const q = (sp.get('q') || '').toLowerCase();
  const tab = TABS.find(([k]) => k === (sp.get('vue') || sp.get('filtre'))) || TABS[0];
  const list = items.filter(tab[2]).filter((l: any) => !q || `${l.title} ${l.category} ${l.sub}`.toLowerCase().includes(q));
  const byId = Object.fromEntries(items.map((l: any) => [l.id, l]));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Seg items={TABS.map(([k, l, fn]) => ({ label: `${l} (${items.filter(fn).length})`, to: `?vue=${k}`, on: tab[0] === k }))} className="max-w-full overflow-x-auto no-scrollbar" />
        <Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className="btn-primary h-10 press shadow-[0_6px_16px_-8px_rgb(201_67_16/.7)]"><Plus className="size-4" />Poser Une Annonce</Link>
      </div>
      {q && <p className="text-sm text-muted">Résultats pour « {sp.get('q')} » : {list.length} <Link to="?" className="text-orange font-semibold ml-2">Effacer</Link></p>}
      {a?.error && <Alert>{a.error}</Alert>}
      {a?.info && <Alert tone="success">{a.info}</Alert>}
      {list.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-[13px] min-w-[860px]">
            <thead className="bg-sable text-[11.5px] text-muted">
              <tr><th className="w-10 pl-4"><span className="sr-only">Sélection</span></th><th className="text-left font-medium py-2.5">Annonce</th><th className="text-left font-medium">Prix</th><th className="text-left font-medium">Stock</th>
                <th className="text-left font-medium">État</th><th className="text-left font-medium">Visibilité</th><th className="text-left font-medium">Vues</th><th className="text-right font-medium pr-4">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((l: any, i: number) => {
                const days = l.featured && l.featured_until ? Math.max(1, Math.ceil((new Date(l.featured_until).getTime() - Date.now()) / 864e5)) : 0;
                const low = l.status === 'active' && l.stock <= 3;
                return (
                  <tr key={l.id} className="hover:bg-sable/50 transition-colors" {...stagger(i, 30)}>
                    <td className="pl-4"><input type="checkbox" className="size-4 accent-indigo rounded" aria-label={`Sélectionner ${l.title}`} /></td>
                    <td className="py-3 pr-3"><div className="flex items-center gap-3">
                      <img src={img(l.photo)} alt="" className="size-11 rounded-[10px] object-cover bg-sable-2" />
                      <div className="min-w-0"><Link prefetch="intent" to={`/a/${l.id}`} className="font-semibold text-ink hover:underline line-clamp-1">{l.title}</Link><p className="text-[11.5px] text-muted">{l.category} / {l.sub}</p></div>
                    </div></td>
                    <td className="font-semibold whitespace-nowrap">{fcfa(l.price_fcfa)}</td>
                    <td className={low ? 'text-orange font-semibold' : ''}>{l.stock}</td>
                    <td><span className={`chip ${low ? 'bg-red-50 text-red-700' : ST[l.status][1]}`}>{low ? 'Stock Bas' : ST[l.status][0]}</span></td>
                    <td>{l.featured ? <span className="chip bg-indigo text-white"><Megaphone className="size-3" />Mis En Avant, {days} jour{days > 1 ? 's' : ''}</span> : <span className="text-muted">Standard</span>}</td>
                    <td>{l.views}</td>
                    <td className="pr-4"><div className="flex items-center justify-end gap-1.5">
                      {l.status === 'active' && <Link prefetch="intent" to={`/ma-boutique/visibilite?annonce=${l.id}`} className="btn btn-sm bg-indigo-50 text-indigo hover:bg-indigo-100"><Megaphone className="size-3.5" />Mettre En Avant</Link>}
                      <RowMenu l={l} />
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <Empty title="Aucune Annonce Ici" text="Publiez un article : il apparaîtra dans le catalogue." action={<Link prefetch="intent" to="/ma-boutique/annonces/nouvelle" className="btn-primary">Poser Une Annonce</Link>} />}
      {pendingSuggestions.map((s: any) => (
        <div key={s.id} className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 flex flex-wrap items-center gap-3 animate-fade-up">
          <Sparkles className="size-5 text-indigo shrink-0" />
          <div className="flex-1 min-w-[240px] text-[13px] text-ink-2"><b className="text-ink">Suggestion de SM-IA</b> pour « {byId[s.listing_id]?.title} » : {s.payload.title}
            {s.payload.description && <span className="block text-muted line-clamp-2 mt-0.5">{s.payload.description}</span>}
            <span className="block text-[11.5px] text-muted mt-0.5">Rien ne sera modifié sans votre accord.</span></div>
          <Form method="post" className="flex gap-2"><input type="hidden" name="id" value={s.id} />
            <button name="intent" value="approve" className="btn-indigo btn-sm"><Check className="size-3.5" />Appliquer</button>
            <button name="intent" value="reject" className="btn-ghost btn-sm"><X className="size-3.5" />Refuser</button>
          </Form>
        </div>
      ))}
    </div>
  );
}

// Menu « … » d'une annonce : SM-IA, pause, vendue, suppression (confirmation en deux temps)
function RowMenu({ l }: { l: any }) {
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const busy = useNavigation().state === 'submitting';
  const item = 'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[13px] hover:bg-sable';
  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); setConfirmDel(false); }} className="size-8 rounded-lg hover:bg-sable flex items-center justify-center text-ink-2" aria-label="Plus d’actions" aria-expanded={open}><MoreHorizontal className="size-4" /></button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
          <Form method="post" className="absolute right-0 top-full mt-1 z-50 w-56 card p-1.5 shadow-xl animate-[dropdown_.16s_ease-out]" onSubmit={() => setOpen(false)}>
            <input type="hidden" name="id" value={l.id} />
            <button name="intent" value="improve" className={`${item} text-turquoise`} disabled={busy}><Sparkles className="size-4" />Améliorer avec SM-IA</button>
            {l.status === 'active' && <button name="status" value="paused" className={item}><Pause className="size-4" />Mettre en pause</button>}
            {l.status !== 'active' && <button name="status" value="active" className={item}><Play className="size-4" />{l.status === 'draft' ? 'Publier' : 'Remettre en ligne'}</button>}
            {!['sold', 'draft'].includes(l.status) && <button name="status" value="sold" className={item}><Check className="size-4" />Marquer comme vendue</button>}
            {confirmDel
              ? <button name="intent" value="delete" className={`${item} bg-red-50 text-red-700 font-semibold`}><Trash2 className="size-4" />Confirmer la suppression</button>
              : <button type="button" onClick={() => setConfirmDel(true)} className={`${item} text-red-700`}><Trash2 className="size-4" />Supprimer</button>}
          </Form>
        </>
      )}
    </div>
  );
}
