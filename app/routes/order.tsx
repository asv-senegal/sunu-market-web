// P14 : suivi d'une commande
import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router';
import { useState } from 'react';
import { ArrowLeft, Check, MapPin, Wallet, MessageCircle, Star, Flag, Clock, Sparkles, BadgeCheck } from 'lucide-react';
import { apiOrThrow } from '~/lib/api.server';
import { orderAction } from '~/lib/orders.server';
import { fcfa, img, ORDER_STATUS, PAY, DELIVERY, dateFr, timeFr } from '~/lib/format';
import { Alert } from '~/components/ui';

export const meta = ({ data: d }: any) => [{ title: `Commande ${d?.order?.ref || ''} | Sunu-Market` }];
export const loader = ({ request, params }: any) => apiOrThrow(request, `/orders/${params.id}`);
export const action = ({ request }: any) => orderAction(request);

export default function OrderPage() {
  const { order: o, events, role } = useLoaderData<typeof loader>();
  const a = useActionData() as any;
  const busy = useNavigation().state === 'submitting';
  const [schedule, setSchedule] = useState(false);
  const st = ORDER_STATUS[o.status];
  const accepted = events.find((e: any) => e.kind === 'system' && /acceptée/.test(e.body));
  const byAI = accepted && /SM-IA/.test(accepted.body);
  const steps = [
    { done: true, icon: Check, title: 'Commande envoyée via SM-Chat', sub: `${dateFr(o.created_at)} à ${timeFr(o.created_at)}` },
    { done: ['accepted', 'scheduled', 'completed'].includes(o.status), icon: byAI ? Sparkles : Check, title: o.status === 'declined' ? 'Refusée par le commerçant' : o.status === 'cancelled' ? 'Commande annulée' : `Acceptée par ${o.shop_name}`, sub: accepted ? `${dateFr(accepted.created_at)} à ${timeFr(accepted.created_at)}${byAI ? ', par son assistant SM-IA, dans les limites fixées par le commerçant' : ''}` : 'En attente de réponse', bad: ['declined', 'cancelled'].includes(o.status) },
    { done: ['scheduled', 'completed'].includes(o.status), icon: MapPin, title: `Remise et paiement : ${PAY[o.pay_method]}`, sub: o.meeting_place ? `${o.meeting_place}${o.meeting_at ? `, le ${dateFr(o.meeting_at)} à ${timeFr(o.meeting_at)}` : ''}` : 'Lieu à convenir dans SM-Chat' },
    { done: o.status === 'completed', icon: Star, title: 'Réception confirmée', sub: o.status === 'completed' ? (o.reviewed ? 'Avis donné, merci !' : 'Vous pouvez laisser un avis') : 'Puis vous pouvez laisser un avis' },
  ];
  const Status = ({ status, children, cls = 'btn-ghost' }: any) => (
    <Form method="post" className="contents"><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value={status} /><button className={`${cls} press w-full`} disabled={busy}>{children}</button></Form>
  );
  return (
    <div className="container-x py-6 max-w-5xl">
      <Link prefetch="intent" to="/commandes" className="inline-flex items-center gap-2 text-sm text-muted hover:text-indigo mb-3"><ArrowLeft className="size-4" />Mes Commandes</Link>
      <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-up">
        <div><h1 className="font-display text-2xl md:text-3xl font-bold text-indigo">Commande {o.ref}</h1><p className="text-sm text-muted">Envoyée le {dateFr(o.created_at)} à {timeFr(o.created_at)}</p></div>
        <span className={`chip ${st.cls} ml-auto py-1 px-3`}><Clock className="size-3.5" />{st.label}</span>
      </div>
      {a?.error && <div className="mb-4"><Alert>{a.error}</Alert></div>}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          <div className="card p-4 flex gap-4 items-center">
            <img src={img(o.photo)} alt="" className="size-20 rounded-xl object-cover" loading="lazy" decoding="async" />
            <div className="flex-1"><p className="font-semibold">{o.quantity} × {o.title_snapshot}</p><p className="text-xs text-muted">{DELIVERY[o.delivery_mode]} · paiement direct par {PAY[o.pay_method]}</p></div>
            <p className="font-display font-bold text-orange text-lg">{fcfa(o.total_fcfa)}</p>
          </div>
          <div className="card p-6">
            <h2 className="font-display font-semibold text-indigo mb-5">Suivi</h2>
            <ol className="relative">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-4 pb-6 last:pb-0 relative" data-reveal="left" style={{ '--d': `${i * 120}ms` } as React.CSSProperties}>
                  {i < steps.length - 1 && <span className={`absolute left-[17px] top-9 bottom-0 w-0.5 ${steps[i + 1].done ? 'bg-turquoise' : 'bg-sable-dark'}`} />}
                  <span className={`size-9 shrink-0 rounded-full flex items-center justify-center relative z-10 ${s.bad ? 'bg-red-100 text-red-700' : s.done ? 'bg-turquoise text-white' : 'bg-sable-dark text-muted'} ${s.done && !steps[i + 1]?.done && !s.bad ? 'live-dot' : ''}`}>
                    {s.done || s.bad ? <s.icon className="size-4" /> : <span className="text-sm font-bold">{i + 1}</span>}
                  </span>
                  <div><p className={`font-semibold text-sm ${s.done ? 'text-ink' : 'text-muted'}`}>{s.title}</p><p className="text-xs text-muted mt-0.5">{s.sub}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <aside className="space-y-4">
          {o.meeting_place && (
            <div className="card p-5 bg-indigo text-white border-indigo animate-fade-up">
              <p className="flex items-center gap-2 font-semibold"><MapPin className="size-5" />{o.meeting_place}</p>
              {o.meeting_at && <p className="text-sm text-white/80 mt-1">Le {dateFr(o.meeting_at)} à {timeFr(o.meeting_at)}</p>}
              <p className="text-sm mt-3 flex items-center gap-2"><Wallet className="size-4" />Paiement : {PAY[o.pay_method]}, {fcfa(o.total_fcfa)}</p>
            </div>
          )}
          <div className="card p-5 space-y-3">
            <p className="font-semibold flex items-center gap-1">{role === 'buyer' ? o.shop_name : o.buyer_name}<BadgeCheck className="size-4 text-turquoise" /></p>
            {o.conversation_id && <Link prefetch="intent" to={`/messages/${o.conversation_id}`} className="btn-ghost w-full press"><MessageCircle className="size-4" />Ouvrir SM-Chat</Link>}
            {role === 'buyer' && ['accepted', 'scheduled'].includes(o.status) && <Status status="completed" cls="btn-indigo bg-turquoise hover:bg-turquoise/90"><Check className="size-4" />J’ai Bien Reçu Ma Commande</Status>}
            {role === 'buyer' && ['new', 'accepted'].includes(o.status) && <Status status="cancelled">Annuler La Commande</Status>}
            {role === 'seller' && o.status === 'new' && <><Status status="accepted" cls="btn-primary">Accepter</Status><Status status="declined">Refuser</Status></>}
            {role === 'seller' && ['accepted', 'scheduled'].includes(o.status) && (
              schedule ? (
                <Form method="post" className="space-y-2 animate-slide-down" onSubmit={() => setSchedule(false)}>
                  <input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="scheduled" />
                  <input name="meetingPlace" required placeholder="Lieu (ex. Marché Sandaga)" className="input" defaultValue={o.meeting_place || ''} />
                  <input name="meetingAt" type="datetime-local" className="input" aria-label="Date et heure" />
                  <button className="btn-primary w-full">Confirmer La Remise</button>
                </Form>
              ) : <button onClick={() => setSchedule(true)} className="btn-indigo w-full press">Prévoir La Remise</button>
            )}
            {o.status === 'completed' && !o.reviewed && <Link prefetch="intent" to={`/commandes/${o.id}/avis`} className="btn-primary w-full press"><Star className="size-4" />Laisser Un Avis</Link>}
            {o.report_ref ? <p className="text-xs text-muted">Signalement {o.report_ref} en cours.</p>
              : <Link prefetch="intent" to={`/signaler?type=order&id=${o.id}`} className="text-xs text-muted inline-flex items-center gap-1 hover:text-red-700"><Flag className="size-3.5" />Signaler Un Problème</Link>}
          </div>
        </aside>
      </div>
    </div>
  );
}
