// P23 : Commandes reçues, tableau en colonnes (Nouvelles, Acceptées, Remise Prévue, Terminées) ou liste
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useActionData } from 'react-router';
import { LayoutGrid, List, Download, Sparkles, CalendarClock, Check, Wallet, MapPin } from 'lucide-react';
import { fcfa, ORDER_STATUS, PAY, dateFr, timeFr } from '~/lib/format';
import { apiOrThrow } from '~/lib/api.server';
import { orderAction } from '~/lib/orders.server';
import { Alert, Seg } from '~/components/ui';
import { Select } from '~/components/Select';
import { stagger } from '~/components/motion';

export const meta = () => [{ title: 'Commandes Reçues | Sunu-Market' }];
export const handle = { title: 'Commandes Reçues' };
export const loader = ({ request }: any) => apiOrThrow(request, '/orders?role=seller');
export const action = ({ request }: any) => orderAction(request);
const COLS: [string, string[], string][] = [['Nouvelles', ['new'], 'bg-orange'], ['Acceptées', ['accepted'], 'bg-indigo'], ['Remise Prévue', ['scheduled'], 'bg-[#E8A317]'], ['Terminées', ['completed', 'declined', 'cancelled'], 'bg-turquoise']];
const PAY_PILL: Record<string, string> = { wave: 'bg-[#E6F4FD] text-[#0A6CB5]', orange_money: 'bg-orange-50 text-orange-dark', cash: 'bg-sable-2 text-ink-2' };
const DATES: [string, string, number][] = [['', 'Toutes Les Dates', 0], ['1', 'Aujourd’hui', 1], ['7', '7 Derniers Jours', 7], ['30', '30 Derniers Jours', 30]];

export default function SellerOrders() {
  const { items } = useLoaderData<typeof loader>();
  const a = useActionData() as any;
  const [sp, setSp] = useSearchParams();
  const list = sp.get('vue') === 'liste';
  const days = Number(sp.get('jours') || 0);
  const q = (sp.get('q') || '').toLowerCase();
  const shown = items.filter((o: any) => (!days || Date.now() - new Date(o.created_at).getTime() < days * 864e5)
    && (!q || `${o.ref} ${o.title_snapshot} ${o.buyer_name}`.toLowerCase().includes(q)));
  const to = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); return `?${n}`; };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Seg items={[{ label: <><LayoutGrid className="size-3.5" />Tableau</>, to: to('vue', ''), on: !list }, { label: <><List className="size-3.5" />Liste</>, to: to('vue', 'liste'), on: list }]} />
        <Select size="sm" className="w-48" value={sp.get('jours') || ''} onChange={(v: string) => setSp((p) => { v ? p.set('jours', v) : p.delete('jours'); return p; })} aria-label="Période" options={DATES.map(([v, l]) => ({ value: v, label: l }))} />
        <a href="/exports/commandes.csv" className="btn-ghost btn-sm ml-auto"><Download className="size-3.5" />Exporter</a>
      </div>
      {a?.error && <Alert>{a.error}</Alert>}
      {list ? (
        <div className="card overflow-x-auto animate-fade-up">
          <table className="w-full text-[13px] min-w-[720px]">
            <thead className="bg-sable text-[11.5px] text-muted text-left"><tr><th className="px-4 py-2.5 font-medium">Commande</th><th className="font-medium">Article</th><th className="font-medium">Acheteur</th><th className="font-medium">Paiement</th><th className="font-medium">Total</th><th className="font-medium pr-4">État</th></tr></thead>
            <tbody className="divide-y divide-line">
              {shown.map((o: any) => (
                <tr key={o.id} className="hover:bg-sable/50"><td className="px-4 py-3"><Link prefetch="intent" to={`/commandes/${o.id}`} className="font-semibold text-indigo hover:underline">{o.ref}</Link><p className="text-[11px] text-muted">{dateFr(o.created_at)}</p></td>
                  <td>{o.quantity} × {o.title_snapshot}</td><td>{o.buyer_name}</td><td><span className={`chip ${PAY_PILL[o.pay_method]}`}>{PAY[o.pay_method]}</span></td>
                  <td className="font-semibold whitespace-nowrap">{fcfa(o.total_fcfa)}</td><td className="pr-4"><span className={`chip ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span></td></tr>
              ))}
              {!shown.length && <tr><td colSpan={6} className="p-6 text-center text-muted">Aucune commande sur cette période.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLS.map(([title, sts, dot]) => {
            const col = shown.filter((o: any) => sts.includes(o.status));
            return (
              <section key={title} className="rounded-2xl bg-sable-2/70 p-3 min-w-0" data-reveal="">
                <h2 className="font-semibold text-sm text-ink mb-3 px-1 flex items-center gap-2"><i className={`size-2 rounded-full ${dot}`} />{title}<span className="ml-auto chip bg-white text-ink-2">{col.length}</span></h2>
                <div className="space-y-2.5">{col.length ? col.slice(0, 5).map((o: any, i: number) => <MiniCard key={o.id} o={o} i={i} />) : <p className="text-xs text-muted bg-white/60 rounded-xl p-4 text-center">Aucune commande.</p>}
                  {col.length > 5 && <Link prefetch="intent" to={to('vue', 'liste')} className="block text-center text-[12.5px] font-semibold text-orange py-1.5">Voir les {col.length} commandes</Link>}</div>
              </section>
            );
          })}
        </div>
      )}
      <p className="rounded-2xl bg-indigo-50 text-indigo text-[13px] p-4 flex gap-2.5"><Wallet className="size-4 shrink-0 mt-0.5" />Le client vous paie directement, par Wave, Orange Money ou en espèces, selon ce qui a été convenu. Sunu-Market ne prélève aucune commission.</p>
    </div>
  );
}

function MiniCard({ o, i }: { o: any; i: number }) {
  const busy = useNavigation().state === 'submitting';
  const ini = String(o.buyer_name).replace(/\./g, '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="bg-white rounded-xl p-3.5 shadow-[0_1px_2px_rgb(22_28_58/.05),0_4px_12px_-6px_rgb(22_28_58/.12)] hover:-translate-y-0.5 transition-transform" {...stagger(i, 40)}>
      <Link prefetch="intent" to={`/commandes/${o.id}`} className="flex items-center gap-2.5">
        <span className={`size-8 rounded-full text-white text-[11px] font-semibold flex items-center justify-center shrink-0 ${['bg-turquoise', 'bg-orange', 'bg-indigo'][i % 3]}`}>{ini}</span>
        <span className="min-w-0"><b className="block text-[13px] text-ink">{o.buyer_name}</b><span className="block text-[11.5px] text-muted truncate">{o.title_snapshot}{o.quantity > 1 ? ` x${o.quantity}` : ''}</span></span>
      </Link>
      <div className="flex items-center justify-between mt-2.5"><b className="font-display text-sm">{fcfa(o.total_fcfa)}</b><span className={`chip ${PAY_PILL[o.pay_method]} text-[10.5px]`}>{PAY[o.pay_method]}</span></div>
      {o.status === 'new' && (
        <Form method="post" className="mt-2.5"><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="accepted" />
          <button className="btn-primary btn-sm w-full press" disabled={busy}>Accepter</button></Form>
      )}
      {o.by_ai && o.status !== 'new' && <p className="mt-2.5 rounded-lg bg-turquoise-50 text-turquoise text-[11px] font-semibold px-2 py-1 flex items-center gap-1"><Sparkles className="size-3" />SM-IA</p>}
      {o.status === 'accepted' && <Link prefetch="intent" to={`/commandes/${o.id}`} className="mt-2 text-[11.5px] text-muted flex items-center gap-1 hover:text-indigo"><CalendarClock className="size-3.5" />Remise à fixer</Link>}
      {o.status === 'scheduled' && <p className="mt-2 text-[11.5px] text-muted flex items-center gap-1"><MapPin className="size-3.5" />{o.meeting_at ? `${dateFr(o.meeting_at)} ${timeFr(o.meeting_at)}, ` : ''}{o.meeting_place}</p>}
      {o.status === 'completed' && <p className="mt-2 text-[11.5px] text-turquoise font-medium flex items-center gap-1"><Check className="size-3.5" />Reçue et payée</p>}
      {['declined', 'cancelled'].includes(o.status) && <p className="mt-2 text-[11.5px] text-muted">{ORDER_STATUS[o.status].label}</p>}
    </div>
  );
}
