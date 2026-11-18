// Fil SM-Chat : messages, commandes liées, rafraîchissement automatique
import { Link, useFetcher, useLoaderData, useRevalidator, data } from 'react-router';
import { useEffect, useRef } from 'react';
import { ArrowLeft, Send, ShoppingBag, Info, Sparkles, ImagePlus } from 'lucide-react';
import { api, apiOrThrow, formError } from '~/lib/api.server';
import { fcfa, img, timeFr, dateFr, ORDER_STATUS, PAY } from '~/lib/format';

export async function loader({ request, params }: any) {
  return apiOrThrow(request, `/conversations/${params.id}`);
}
export async function action({ request, params }: any) {
  const f = await request.formData();
  if (f.get('intent') === 'image') {
    const fd = new FormData(); fd.append('image', f.get('image') as File);
    const r = await api(request, `/conversations/${params.id}/images`, { form: fd });
    return r.ok ? { ok: true } : formError(r);
  }
  const r = await api(request, `/conversations/${params.id}/messages`, { json: { body: f.get('body') } });
  return r.ok ? { ok: true } : formError(r);
}

export default function Thread() {
  const { conversation: c, messages, orders } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const imgFetcher = useFetcher();
  const rv = useRevalidator();
  const end = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  // Rafraîchit toutes les 5 secondes quand l'onglet est visible (économe en données)
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible' && rv.state === 'idle') rv.revalidate(); }, 5000);
    return () => clearInterval(t);
  }, [rv]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);
  useEffect(() => { if (fetcher.state === 'idle' && (fetcher.data as any)?.ok) form.current?.reset(); }, [fetcher.state, fetcher.data]);

  let lastDay = '';
  return (
    <>
      <header className="flex items-center gap-3 p-3 border-b border-sable-dark">
        <Link prefetch="intent" to="/messages" className="md:hidden p-1" aria-label="Retour"><ArrowLeft className="size-5" /></Link>
        <img src={img(c.photo)} alt="" className="size-10 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate flex items-center gap-2">{c.iAmSeller ? c.buyer_name : c.shop_name}
            {c.smiaActive && <span className="chip bg-turquoise-50 text-turquoise text-[10px]"><Sparkles className="size-3" />SM-IA Actif</span>}</p>
          <Link prefetch="intent" to={`/a/${c.listing_id}`} className="text-xs text-muted truncate block hover:underline">{c.title} · {fcfa(c.price_fcfa)}</Link>
        </div>
        {c.iAmSeller ? <Link prefetch="intent" to="/ma-boutique/commandes" className="btn-ghost btn-sm">Commandes</Link> : <Link prefetch="intent" to="/commandes" className="btn-ghost btn-sm">Mes Achats</Link>}
      </header>
      {orders.length > 0 && (
        <div className="px-3 py-2 bg-sable border-b border-sable-dark flex gap-2 overflow-x-auto">
          {orders.map((o: any) => (
            <span key={o.id} className="chip bg-white border border-sable-dark whitespace-nowrap py-1">
              <ShoppingBag className="size-3" />{o.ref} · {fcfa(o.total_fcfa)} · {PAY[o.pay_method]}
              <span className={`chip ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span>
            </span>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-sable/50" aria-live="polite">
        <p className="text-[11px] text-muted text-center flex items-center justify-center gap-1"><Info className="size-3" />Le paiement se fait directement entre vous. Ne payez jamais avant d’avoir vu l’article.</p>
        {messages.map((m: any) => {
          const day = dateFr(m.created_at); const showDay = day !== lastDay; lastDay = day;
          const mine = m.sender_id && ((c.iAmSeller && m.sender_id === c.seller_id) || (!c.iAmSeller && m.sender_id === c.buyer_id));
          const ai = m.kind === 'ai';
          return (
            <div key={m.id}>
              {showDay && <p className="text-center text-[11px] text-muted my-3">{day}</p>}
              {m.kind === 'system' ? (
                <p className="text-center text-xs text-indigo bg-indigo-50 rounded-full px-3 py-1 w-fit mx-auto animate-pop">{m.body}</p>
              ) : (
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-pop`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.kind === 'order' ? 'bg-orange-50 border border-orange/30 text-ink' : ai ? 'bg-turquoise-50 border border-turquoise/30 text-ink' : mine ? 'bg-indigo text-white' : 'bg-white border border-sable-dark'}`}>
                    {m.kind === 'order' && <p className="text-[11px] font-semibold text-orange-dark mb-0.5 flex items-center gap-1"><ShoppingBag className="size-3" />Commande</p>}
                    {ai && <p className="text-[11px] font-semibold text-turquoise mb-0.5 flex items-center gap-1"><Sparkles className="size-3" />SM-IA, réponse automatique pour {c.shop_name}</p>}
                    {m.kind === 'image' && m.image_url ? <a href={m.image_url} target="_blank" rel="noreferrer"><img src={m.image_url} alt="Photo envoyée" className="rounded-xl max-h-60 object-cover" loading="lazy" /></a> : <p className="whitespace-pre-line">{m.body}</p>}
                    <p className={`text-[10px] mt-1 text-right ${mine && m.kind === 'text' || mine && m.kind === 'image' ? 'text-white/60' : 'text-muted'}`}>{timeFr(m.created_at)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <fetcher.Form ref={form} method="post" className="p-3 border-t border-sable-dark flex gap-2 items-center">
        <label className={`size-10 shrink-0 rounded-full flex items-center justify-center cursor-pointer hover:bg-sable text-indigo ${imgFetcher.state !== 'idle' ? 'animate-pulse' : ''}`} aria-label="Envoyer une photo">
          <ImagePlus className="size-5" />
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => {
            const file = e.target.files?.[0]; if (!file) return;
            const fd = new FormData(); fd.append('intent', 'image'); fd.append('image', file);
            imgFetcher.submit(fd, { method: 'post', encType: 'multipart/form-data' }); e.target.value = '';
          }} />
        </label>
        <input name="body" required maxLength={2000} autoComplete="off" placeholder="Écrire un message…" className="input rounded-full" aria-label="Message" />
        <button className="btn-primary rounded-full w-11 px-0" disabled={fetcher.state !== 'idle'} aria-label="Envoyer"><Send className="size-4" /></button>
      </fetcher.Form>
      {(fetcher.data as any)?.error && <p className="px-4 pb-2 text-xs text-red-700">{(fetcher.data as any).error}</p>}
    </>
  );
}
