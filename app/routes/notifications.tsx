// P18 : notifications et préférences par canal
import { Form, Link, useLoaderData, useFetcher } from 'react-router';
import { useState } from 'react';
import { Settings2, ShoppingBag, MessageCircle, Sparkles, ShieldCheck, Bell } from 'lucide-react';
import { api, apiOrThrow, requireMe } from '~/lib/api.server';
import { ago } from '~/lib/format';
import { Empty, PageTitle } from '~/components/ui';
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
const KIND_ICON: Record<string, any> = { order: ShoppingBag, message: MessageCircle, smia: Sparkles, smia_low: Sparkles, verification: ShieldCheck };

export default function Notifications() {
  const { items, groups } = useLoaderData<typeof loader>();
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<any>(() => Object.fromEntries(Object.entries(groups).map(([k, g]: any) => [k, { app: g.app, sms: g.sms, whatsapp: g.whatsapp }])));
  const f = useFetcher();
  return (
    <div className="container-x py-6 max-w-2xl">
      <PageTitle title="Notifications">
        <div className="flex gap-2">
          {items.some((n: any) => !n.read_at) && <Form method="post"><button className="btn-ghost btn-sm">Tout Marquer Comme Lu</button></Form>}
          <button onClick={() => setOpen(!open)} className="btn-ghost btn-sm" aria-expanded={open}><Settings2 className="size-4" />Préférences</button>
        </div>
      </PageTitle>
      {open && (
        <f.Form method="post" className="card p-5 mb-5 animate-slide-down">
          <input type="hidden" name="intent" value="prefs" /><input type="hidden" name="prefs" value={JSON.stringify(prefs)} />
          <h2 className="font-display font-semibold text-indigo mb-3">Comment Être Prévenu ?</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted text-left"><tr><th className="py-2">Sujet</th><th className="text-center">Application</th><th className="text-center">SMS</th><th className="text-center">WhatsApp</th></tr></thead>
            <tbody className="divide-y divide-sable-dark">
              {Object.entries(groups).map(([k, g]: any) => (
                <tr key={k}><td className="py-2.5">{g.label}</td>
                  {['app', 'sms', 'whatsapp'].map((c) => (
                    <td key={c} className="text-center">
                      <input type="checkbox" className="size-4 accent-turquoise" checked={!!prefs[k][c]} disabled={c === 'app'} aria-label={`${g.label} par ${c}`}
                        onChange={(e) => setPrefs({ ...prefs, [k]: { ...prefs[k], [c]: e.target.checked } })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted mt-3">Les notifications dans l’application restent toujours actives. Envoi WhatsApp : bientôt disponible.</p>
          <button className="btn-indigo btn-sm mt-3">{f.state !== 'idle' ? 'Enregistrement…' : (f.data as any)?.saved ? 'Enregistré' : 'Enregistrer'}</button>
        </f.Form>
      )}
      {items.length ? (
        <ul className="space-y-2">
          {items.map((n: any, i: number) => {
            const Icon = KIND_ICON[n.kind] || Bell;
            const inner = (
              <div className={`card flex gap-3 p-4 ${n.read_at ? '' : 'border-orange/40 bg-orange-50/40'}`}>
                <span className={`size-10 rounded-xl shrink-0 flex items-center justify-center ${n.read_at ? 'bg-sable text-muted' : 'bg-orange text-white'}`}><Icon className="size-5" /></span>
                <div className="flex-1"><p className="font-semibold text-sm">{n.title}</p>{n.body && <p className="text-sm text-muted">{n.body}</p>}</div>
                <span className="text-xs text-muted whitespace-nowrap">{ago(n.created_at)}</span>
              </div>
            );
            return <li key={n.id} {...stagger(i, 40)}>{n.link ? <Link prefetch="intent" to={n.link} className="block lift rounded-2xl">{inner}</Link> : inner}</li>;
          })}
        </ul>
      ) : <Empty title="Aucune Notification" text="Vous serez prévenu ici des messages, commandes et décisions." />}
    </div>
  );
}
