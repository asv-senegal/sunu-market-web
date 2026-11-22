// P31 : annonces signalées, boutiques, catégories, articles interdits
import { Form, Link, useLoaderData, useSearchParams, useActionData } from 'react-router';
import { Megaphone, EyeOff, Eye, Plus, Ban } from 'lucide-react';
import { api, apiOrThrow } from '~/lib/api.server';
import { fcfa, img, dateFr } from '~/lib/format';
import { Alert, PageTitle } from '~/components/ui';

export async function loader({ request }: any) {
  const url = new URL(request.url);
  const vue = url.searchParams.get('vue') || 'signalees';
  const q = url.searchParams.get('q') || '';
  const out: any = { vue, q };
  if (vue === 'signalees' || vue === 'toutes') out.items = (await apiOrThrow(request, `/admin/listings?${vue === 'signalees' ? 'flagged=1&' : ''}${q ? `q=${encodeURIComponent(q)}` : ''}`)).items;
  if (vue === 'boutiques') out.shops = (await apiOrThrow(request, '/admin/shops')).items;
  if (vue === 'categories') out.cats = (await apiOrThrow(request, '/admin/categories')).items;
  if (vue === 'interdits') { const s = await api(request, '/admin/settings'); out.prohibited = s.ok ? s.data.items.find((x: any) => x.key === 'prohibited_items')?.value : null; out.canEdit = s.ok; }
  return out;
}
export async function action({ request }: any) {
  const f = await request.formData();
  const i = f.get('intent');
  let r: any;
  if (i === 'remove') r = await api(request, `/admin/listings/${f.get('id')}/remove`, { json: { reason: f.get('reason') } });
  if (i === 'shop') r = await api(request, `/admin/shops/${f.get('id')}/status`, { json: { status: f.get('status'), reason: f.get('reason') } });
  if (i === 'sub') r = await api(request, `/admin/subcategories/${f.get('id')}`, { method: 'PATCH', json: { hidden: f.get('hidden') === '1' } });
  if (i === 'rename') r = await api(request, `/admin/subcategories/${f.get('id')}`, { method: 'PATCH', json: { name: f.get('name') } });
  if (i === 'addsub') r = await api(request, `/admin/categories/${f.get('id')}/subcategories`, { json: { name: f.get('name') } });
  if (i === 'prohibited') r = await api(request, '/admin/settings/prohibited_items', { method: 'PATCH', json: { value: String(f.get('items')).split('\n').map((x) => x.trim()).filter(Boolean) } });
  return r && !r.ok ? { error: r.data.error } : { ok: true };
}
const TABS = [['signalees', 'Annonces Signalées'], ['toutes', 'Toutes Les Annonces'], ['boutiques', 'Boutiques'], ['categories', 'Catégories (12)'], ['interdits', 'Articles Interdits']];

export default function AdminListings() {
  const d = useLoaderData<typeof loader>();
  const a = useActionData<typeof action>() as any;
  const [sp] = useSearchParams();
  return (
    <>
      <PageTitle title="Annonces Et Boutiques" sub="Les annonces signalées apparaissent en premier." />
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {TABS.map(([k, l]) => <Link prefetch="intent" key={k} to={`?vue=${k}`} className={`chip whitespace-nowrap py-1.5 px-3 ${d.vue === k ? 'bg-indigo text-white' : 'bg-white border border-sable-dark'}`}>{l}</Link>)}
      </div>
      {d.items && (
        <>
          {d.vue === 'toutes' && <Form className="mb-3"><input type="hidden" name="vue" value="toutes" /><input name="q" defaultValue={d.q} placeholder="Rechercher une annonce ou une boutique…" className="input max-w-sm" /></Form>}
          <div className="space-y-3">
            {d.items.length === 0 && <p className="card p-6 text-sm text-muted">Aucune annonce à examiner.</p>}
            {d.items.map((l: any, i: number) => (
              <div key={l.id} className={`card p-3 flex flex-wrap items-center gap-3 ${l.open_reports ? 'border-orange/40' : ''}`} data-reveal="" style={{ '--d': `${Math.min(i, 8) * 40}ms` } as React.CSSProperties}>
                <img src={img(l.photo)} alt="" className="size-14 rounded-xl object-cover" loading="lazy" decoding="async" />
                <div className="flex-1 min-w-[200px]">
                  <Link prefetch="intent" to={`/a/${l.id}`} className="font-semibold text-sm hover:underline">{l.title}</Link>
                  <p className="text-xs text-muted">{l.shop_name} · {l.category} › {l.sub} · {dateFr(l.created_at)}</p>
                  {l.open_reports > 0 && <Link prefetch="intent" to="/admin/signalements" className="chip bg-orange-50 text-orange-dark mt-1">{l.open_reports} signalement(s)</Link>}
                </div>
                {l.featured && <span className="chip bg-indigo text-white"><Megaphone className="size-3" />Mis En Avant</span>}
                <span className="text-sm font-semibold">{fcfa(l.price_fcfa)}</span>
                <span className="chip bg-sable-dark">{l.status}</span>
                {l.status !== 'removed' && (
                  <Form method="post" className="flex gap-1"><input type="hidden" name="intent" value="remove" /><input type="hidden" name="id" value={l.id} />
                    <input name="reason" required minLength={3} placeholder="Motif" className="input h-8 w-32 text-xs" /><button className="btn-sm btn bg-red-700 text-white">Retirer</button></Form>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {d.shops && (
        <div className="card overflow-x-auto animate-fade-up">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className="p-3">Boutique</th><th className="p-3">Commerçant</th><th className="p-3">Abonnement</th><th className="p-3">Annonces</th><th className="p-3">Signalements</th><th className="p-3">Action</th></tr></thead>
            <tbody className="divide-y divide-sable-dark">
              {d.shops.map((s: any) => (
                <tr key={s.id}><td className="p-3"><Link prefetch="intent" to={`/b/${s.slug}`} className="font-semibold hover:underline">{s.name}</Link><p className="text-xs text-muted">{s.quarter}</p></td><td className="p-3">{s.owner}</td>
                  <td className="p-3 text-xs">{s.subscription ? `${s.subscription.split(':')[0] === 'trial' ? 'Essai' : 'Annuel'} jusqu’au ${s.subscription.split(':')[1]}` : <span className="text-red-700">Expiré</span>}</td>
                  <td className="p-3">{s.listings}</td><td className="p-3">{s.reports}</td>
                  <td className="p-3"><Form method="post" className="flex gap-1"><input type="hidden" name="intent" value="shop" /><input type="hidden" name="id" value={s.id} /><input type="hidden" name="status" value={s.status === 'active' ? 'suspended' : 'active'} />
                    <input name="reason" required minLength={3} placeholder="Motif" className="input h-8 w-28 text-xs" /><button className={`btn-sm btn ${s.status === 'active' ? 'bg-red-700 text-white' : 'btn-primary'}`}>{s.status === 'active' ? 'Suspendre' : 'Réactiver'}</button></Form></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {d.cats && (
        <div className="grid lg:grid-cols-2 gap-4">
          {d.cats.map((c: any, i: number) => (
            <div key={c.id} className="card p-4" data-reveal="" style={{ '--d': `${(i % 4) * 60}ms` } as React.CSSProperties}>
              <p className="font-display font-semibold text-indigo mb-2">{c.name} <span className="text-xs text-muted font-normal">{c.subs.length} sous-catégories</span></p>
              <ul className="divide-y divide-sable-dark text-sm">
                {c.subs.map((s: any) => (
                  <li key={s.id} className={`py-1.5 flex items-center gap-2 ${s.hidden ? 'opacity-50' : ''}`}>
                    <Form method="post" className="flex-1 flex gap-1"><input type="hidden" name="intent" value="rename" /><input type="hidden" name="id" value={s.id} />
                      <input name="name" defaultValue={s.name} className="flex-1 bg-transparent border-b border-transparent focus:border-turquoise outline-none" aria-label="Nom de la sous-catégorie" /></Form>
                    <span className="text-[10px] text-muted">{s.source}</span><span className="text-xs text-muted w-8 text-right">{s.listings}</span>
                    <Form method="post"><input type="hidden" name="intent" value="sub" /><input type="hidden" name="id" value={s.id} /><input type="hidden" name="hidden" value={s.hidden ? '0' : '1'} />
                      <button className="p-1 text-muted hover:text-indigo" aria-label={s.hidden ? 'Afficher' : 'Masquer'}>{s.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button></Form>
                  </li>
                ))}
              </ul>
              <Form method="post" className="flex gap-2 mt-2"><input type="hidden" name="intent" value="addsub" /><input type="hidden" name="id" value={c.id} />
                <input name="name" required minLength={2} placeholder="Nouvelle sous-catégorie" className="input h-8 text-xs" /><button className="btn-ghost btn-sm"><Plus className="size-3.5" /></button></Form>
            </div>
          ))}
        </div>
      )}
      {d.vue === 'interdits' && (
        <Form method="post" className="card p-5 max-w-xl space-y-3 animate-fade-up">
          <input type="hidden" name="intent" value="prohibited" />
          <p className="font-display font-semibold text-indigo flex items-center gap-2"><Ban className="size-4 text-red-700" />Articles Interdits</p>
          <p className="text-xs text-muted">Un article par ligne. Cette liste guide la modération humaine et la modération automatique de SM-IA. À faire valider par un juriste.</p>
          <textarea name="items" rows={8} defaultValue={(d.prohibited || []).join('\n')} className="input h-auto py-2" disabled={!d.canEdit} />
          {d.canEdit ? <button className="btn-indigo btn-sm">Enregistrer</button> : <p className="text-xs text-muted">Modification réservée à l’administrateur.</p>}
          {a?.ok && <Alert tone="success">Liste enregistrée.</Alert>}
        </Form>
      )}
    </>
  );
}
