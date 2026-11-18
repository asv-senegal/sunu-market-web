// Signaler une annonce, un membre ou une commande. Sunu-Market ne rembourse pas : un modérateur examine chaque signalement.
import { Form, useActionData, useSearchParams, redirect } from 'react-router';
import { Flag } from 'lucide-react';
import { api, requireMe, formError } from '~/lib/api.server';
import { REPORT_REASON } from '~/lib/format';
import { Alert } from '~/components/ui';
import { Select } from '~/components/Select';

export const meta = () => [{ title: 'Signaler | Sunu-Market' }];
export async function loader({ request }: any) { await requireMe(request); return null; }
export async function action({ request }: any) {
  const f = await request.formData();
  const r = await api(request, '/reports', { json: { targetType: f.get('type'), targetId: f.get('id'), reason: f.get('reason'), details: f.get('details') || undefined } });
  return r.ok ? { done: r.data.report.ref } : formError(r);
}

export default function Report() {
  const [sp] = useSearchParams();
  const a = useActionData<typeof action>() as any;
  if (a?.done) return <div className="container-x py-10 max-w-xl"><Alert tone="success">Signalement {a.done} envoyé. Un modérateur l’examinera ; vous serez notifié de la décision.</Alert></div>;
  return (
    <div className="container-x py-8 max-w-xl">
      <h1 className="font-display text-2xl font-bold text-indigo flex items-center gap-2"><Flag className="size-6 text-orange" />Signaler Un Problème</h1>
      <p className="text-sm text-muted mt-1 mb-6">Le paiement se fait entre membres : Sunu-Market ne rembourse pas, mais peut avertir, retirer une annonce ou suspendre un compte.</p>
      <Form method="post" className="card p-6 space-y-4">
        {a?.error && <Alert>{a.error}</Alert>}
        <input type="hidden" name="type" value={sp.get('type') || 'listing'} /><input type="hidden" name="id" value={sp.get('id') || ''} />
        <label className="block"><span className="label">Motif</span>
          <Select name="reason" required defaultValue="not_received" options={Object.entries(REPORT_REASON).map(([k, v]) => ({ value: k, label: v }))} />
        </label>
        <label className="block"><span className="label">Description</span><textarea name="details" rows={4} maxLength={2000} className="input h-auto py-2" placeholder="Décrivez ce qui s’est passé." /></label>
        <button className="btn-primary w-full">Envoyer Le Signalement</button>
      </Form>
    </div>
  );
}
