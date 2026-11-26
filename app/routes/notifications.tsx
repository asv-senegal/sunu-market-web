// P18 : notifications et préférences par canal
import { Form, Link, useLoaderData, useFetcher } from 'react-router';
import { useState } from 'react';
import { ShoppingBag, MessageCircle, Sparkles, ShieldCheck, Bell, Smartphone, Coins, Gift, Star, Flag } from 'lucide-react';
import { api, apiOrThrow, requireMe } from '~/lib/api.server';
import { ago } from '~/lib/format';
import { Empty } from '~/components/ui';
import { stagger } from '~/components/motion';

export const meta = () => [{ title: 'Notifications | Sunu-Market' }];
export async function loader({ request }: any) {
  await requireMe(request, { verified: false });
  const [n, p] = await Promise.all([apiOrThrow(request, '/me/notifications'), apiOrThrow(request, '/me/notification-prefs')]);
  return { items: n.items, groups: p.groups };
}
export async function action({ request }: any) {
  const f = await request.formData();
  if (f.get('intent') === 'prefs') {
    const prefs = JSON.parse(String(f.get('prefs')));
    await api(request, '/me/notification-prefs', { method: 'PUT', json: prefs });
    return { saved: true };
  }
  await api(request, '/me/notifications/read', { method: 'POST' });
  return null;
}
const KIND_ICON: Record<string, [any, string]> = {
  order: [ShoppingBag, 'bg-orange-50 text-orange'], message: [MessageCircle, 'bg-indigo-50 text-indigo'], smia: [Sparkles, 'bg-turquoise-50 text-turquoise'],
  smia_low: [Coins, 'bg-indigo-50 text-indigo'], verification: [ShieldCheck, 'bg-turquoise-50 text-turquoise'], trial: [Gift, 'bg-[#FDF3D7] text-[#8A5A00]'],
  subscription: [Gift, 'bg-[#FDF3D7] text-[#8A5A00]'], review: [Star, 'bg-turquoise-50 text-turquoise'], report: [Flag, 'bg-red-50 text-red-700'],
};

export default function Notifications() {
  const { items, groups } = useLoaderData<typeof loader>();
  const [prefs, setPrefs] = useState<any>(() => Object.fromEntries(Object.entries(groups).map(([k, g]: any) => [k, { app: g.app, sms: g.sms, whatsapp: g.whatsapp }])));
  const f = useFetcher();
  const unread = items.some((n: any) => !n.read_at);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-[28px] font-semibold text-ink animate-fade-up">Notifications</h1>
        {unread && <Form method="post"><button className="text-[13px] font-semibold text-orange hover:underline">Tout Marquer Comme Lu</button></Form>}
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {items.length ? (
          <ul className="space-y-2.5">
            {items.map((n: any, i: number) => {
              const [Icon, tone] = KIND_ICON[n.kind] || [Bell, 'bg-sable-2 text-ink-2'];
              const inner = (
                <div className={`flex gap-3.5 p-4 rounded-2xl transition-colors ${n.read_at ? 'hover:bg-white/60' : 'card'}`}>
                  <span className={`size-10 rounded-xl shrink-0 flex items-center justify-center ${tone}`}><Icon className="size-5" /></span>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-ink">{n.title}</p>{n.body && <p className="text-[13px] text-ink-2 mt-0.5">{n.body}</p>}
                    <p className="text-[11.5px] text-muted mt-1">{ago(n.created_at)}</p></div>
                  {!n.read_at && <span className="size-2 rounded-full bg-orange mt-1.5 shrink-0" aria-label="Non lue" />}
                </div>
              );
              return <li key={n.id} {...stagger(i, 40)}>{n.link ? <Link prefetch="intent" to={n.link} className="block rounded-2xl">{inner}</Link> : inner}</li>;
            })}
          </ul>
        ) : <Empty title="Aucune Notification" text="Vous serez prévenu ici des messages, commandes et décisions." />}
        <f.Form method="post" className="card p-5 lg:sticky lg:top-24" data-reveal="">
          <input type="hidden" name="intent" value="prefs" /><input type="hidden" name="prefs" value={JSON.stringify(prefs)} />
          <h2 className="font-display font-semibold text-ink">Canaux</h2>
          <p className="text-xs text-muted mt-0.5 mb-3">Choisissez comment être prévenu, sujet par sujet.</p>
          <table className="w-full text-[13px]">
            <thead className="text-[11px] text-muted"><tr><th className="py-1.5 text-left font-medium">Sujet</th>{CHANNELS.map(([c, l, I]) => <th key={c} className="font-medium" title={l}><I className="size-4 mx-auto" aria-label={l} /></th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {Object.entries(groups).map(([k, g]: any) => (
                <tr key={k}><td className="py-2.5 pr-2 text-ink-2">{g.label}</td>
                  {CHANNELS.map(([c, l]) => (
                    <td key={c} className="text-center">
                      <Toggle on={!!prefs[k][c]} disabled={c === 'app'} label={`${g.label} par ${l}`} onChange={(v) => setPrefs({ ...prefs, [k]: { ...prefs[k], [c]: v } })} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr><td className="py-2.5 text-muted">E-mail</td><td colSpan={3} className="text-center text-[11px] text-muted">[à confirmer]</td></tr>
            </tbody>
          </table>
          <p className="text-[11.5px] text-muted mt-3">L’application reste toujours active. Envoi WhatsApp : bientôt disponible.</p>
          <button className="btn-indigo btn-sm mt-3">{f.state !== 'idle' ? 'Enregistrement…' : (f.data as any)?.saved ? 'Enregistré' : 'Enregistrer'}</button>
        </f.Form>
      </div>
    </>
  );
}

const CHANNELS: [string, string, any][] = [['app', 'Application', Bell], ['sms', 'SMS', Smartphone], ['whatsapp', 'WhatsApp', MessageCircle]];
// Interrupteur compact (maquette « Canaux »)
export function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange?.(!on)}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${on ? 'bg-turquoise' : 'bg-line'} ${disabled ? 'opacity-60' : ''}`}>
      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  );
}
