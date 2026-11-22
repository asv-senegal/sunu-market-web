import { Form, Link, useActionData, useNavigation } from 'react-router';
import { useState } from 'react';
import { MessageCircle, MapPin, Star } from 'lucide-react';
import { fcfa, img, ORDER_STATUS, PAY, DELIVERY, dateFr, timeFr } from '~/lib/format';

const TAGS_BUYER = ['Ponctuel', 'Article Conforme', 'Aimable', 'Bonne Communication'];
const TAGS_SELLER = ['Ponctuel', 'Paiement Rapide', 'Aimable', 'Bonne Communication'];

export function OrderCard({ o, role }: { o: any; role: 'buyer' | 'seller' }) {
  const a = useActionData() as any;
  const busy = useNavigation().state === 'submitting';
  const [panel, setPanel] = useState<null | 'schedule' | 'review'>(null);
  const st = ORDER_STATUS[o.status];
  const Btn = ({ status, children, cls = 'btn-ghost btn-sm' }: any) => (
    <Form method="post" className="contents"><input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value={status} />
      <button className={cls} disabled={busy}>{children}</button></Form>
  );
  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <img src={img(o.photo)} alt="" className="size-16 rounded-xl object-cover shrink-0" loading="lazy" decoding="async" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted">{o.ref}</span><span className={`chip ${st.cls}`}>{st.label}</span></div>
          <p className="font-semibold text-sm truncate mt-0.5">{o.quantity} × {o.title_snapshot}</p>
          <p className="text-xs text-muted">{role === 'buyer' ? o.shop_name : o.buyer_name} · {dateFr(o.created_at)}</p>
        </div>
        <p className="font-display font-bold text-indigo whitespace-nowrap">{fcfa(o.total_fcfa)}</p>
      </div>
      <p className="text-xs text-muted mt-3">Paiement direct : {PAY[o.pay_method]} · {DELIVERY[o.delivery_mode]}</p>
      {o.meeting_place && <p className="text-xs text-indigo mt-1 flex items-center gap-1"><MapPin className="size-3" />{o.meeting_place}{o.meeting_at ? `, le ${dateFr(o.meeting_at)} à ${timeFr(o.meeting_at)}` : ''}</p>}
      {a?.id === o.id && a?.error && <p className="text-xs text-red-700 mt-2">{a.error}</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        {o.conversation_id && <Link prefetch="intent" to={`/messages/${o.conversation_id}`} className="btn-ghost btn-sm"><MessageCircle className="size-3.5" />SM-Chat</Link>}
        {role === 'seller' && o.status === 'new' && <><Btn status="accepted" cls="btn-primary btn-sm">Accepter</Btn><Btn status="declined">Refuser</Btn></>}
        {role === 'seller' && ['accepted', 'scheduled'].includes(o.status) && <button onClick={() => setPanel(panel === 'schedule' ? null : 'schedule')} className="btn-indigo btn-sm">Prévoir La Remise</button>}
        {role === 'buyer' && ['accepted', 'scheduled'].includes(o.status) && <Btn status="completed" cls="btn-primary btn-sm">J’ai Reçu L’Article</Btn>}
        {role === 'buyer' && ['new', 'accepted'].includes(o.status) && <Btn status="cancelled">Annuler</Btn>}
        {o.status === 'completed' && !o.reviewed && <button onClick={() => setPanel(panel === 'review' ? null : 'review')} className="btn-indigo btn-sm"><Star className="size-3.5" />Laisser Un Avis</button>}
        {o.status === 'completed' && o.reviewed && <span className="text-xs text-turquoise self-center">Avis envoyé, merci !</span>}
        <Link prefetch="intent" to={`/signaler?type=order&id=${o.id}`} className="text-xs text-muted self-center ml-auto hover:text-red-700">Signaler</Link>
      </div>
      {panel === 'schedule' && (
        <Form method="post" className="mt-3 grid sm:grid-cols-[1fr_200px_auto] gap-2" onSubmit={() => setPanel(null)}>
          <input type="hidden" name="id" value={o.id} /><input type="hidden" name="status" value="scheduled" />
          <input name="meetingPlace" required placeholder="Lieu (ex. Marché Sandaga, entrée principale)" className="input" defaultValue={o.meeting_place || ''} />
          <input name="meetingAt" type="datetime-local" className="input" aria-label="Date et heure" />
          <button className="btn-primary">Confirmer</button>
        </Form>
      )}
      {panel === 'review' && (
        <Form method="post" className="mt-3 space-y-3" onSubmit={() => setPanel(null)}>
          <input type="hidden" name="intent" value="review" /><input type="hidden" name="id" value={o.id} />
          <fieldset className="flex gap-1" aria-label="Note">
            {[5, 4, 3, 2, 1].map((n) => (
              <label key={n} className="chip border border-sable-dark bg-white py-1.5 px-2.5 cursor-pointer has-[:checked]:bg-orange has-[:checked]:text-white">
                <input type="radio" name="rating" value={n} required defaultChecked={n === 5} className="sr-only" />{n}<Star className="size-3 fill-current" />
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            {(role === 'buyer' ? TAGS_BUYER : TAGS_SELLER).map((t) => (
              <label key={t} className="chip border border-sable-dark bg-white py-1.5 px-2.5 cursor-pointer has-[:checked]:bg-turquoise-50 has-[:checked]:border-turquoise">
                <input type="checkbox" name="tags" value={t} className="sr-only" />{t}
              </label>
            ))}
          </div>
          <input name="comment" placeholder="Commentaire (facultatif)" maxLength={600} className="input" />
          <button className="btn-primary btn-sm">Envoyer L’Avis</button>
        </Form>
      )}
    </div>
  );
}
