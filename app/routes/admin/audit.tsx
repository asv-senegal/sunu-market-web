// P35 : journal d'audit en ajout seul, empreintes chaînées, contrôle d'intégrité et export
import { useLoaderData, Form, useActionData } from 'react-router';
import { Lock, Download, ShieldCheck, ShieldAlert } from 'lucide-react';
import { apiOrThrow } from '~/lib/api.server';
import { dateFr, timeFr } from '~/lib/format';
import { PageTitle, Alert } from '~/components/ui';

export const loader = ({ request }: any) => apiOrThrow(request, '/admin/audit');
export const action = ({ request }: any) => apiOrThrow(request, '/admin/audit/verify');
const ROLE: Record<string, string> = { admin: 'Administrateur', moderator: 'Modérateur', finance: 'Finance', support: 'Support', member: 'Membre' };
const tone = (a: string) => a.includes('removed') || a.includes('cut') || a.includes('suspend') ? 'bg-red-50 text-red-700' : a.includes('refund') || a.includes('payment') ? 'bg-[#FCF1D8] text-[#8A5B00]' : a.includes('approved') || a.includes('paid') ? 'bg-turquoise-50 text-turquoise' : 'bg-indigo-50 text-indigo';

export default function Audit() {
  const { items } = useLoaderData<typeof loader>();
  const v = useActionData<typeof action>() as any;
  return (
    <>
      <PageTitle title="Journal D’Audit">
        <div className="flex gap-2">
          <Form method="post"><button className="btn-ghost btn-sm"><ShieldCheck className="size-3.5" />Vérifier L’Intégrité</button></Form>
          <a href="/exports/audit.csv" className="btn-indigo btn-sm"><Download className="size-3.5" />Exporter Pour Contrôle</a>
        </div>
      </PageTitle>
      <div className="card p-4 mb-4 flex gap-3 items-center bg-indigo-50 border-indigo-100 text-sm text-indigo animate-fade-up"><Lock className="size-5 shrink-0" />Journal en ajout seul. Aucune ligne ne peut être modifiée ni supprimée, y compris par un administrateur. Chaque ligne porte une empreinte chaînée à la précédente.</div>
      {v && (v.broken === 0 ? <div className="mb-4"><Alert tone="success"><span className="inline-flex items-center gap-1"><ShieldCheck className="size-4" />Chaîne intacte : {v.total} lignes vérifiées.</span></Alert></div>
        : <div className="mb-4"><Alert><span className="inline-flex items-center gap-1"><ShieldAlert className="size-4" />{v.broken} ligne(s) incohérente(s), à partir de la n° {v.first_broken}.</span></Alert></div>)}
      <div className="card overflow-x-auto" data-reveal="">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="p-3">Horodatage</th><th className="p-3">Auteur</th><th className="p-3">Action</th><th className="p-3">Objet</th><th className="p-3">Empreinte</th></tr></thead>
          <tbody className="divide-y divide-sable-dark">
            {items.map((a: any) => (
              <tr key={a.id} className="hover:bg-sable/50"><td className="p-3 whitespace-nowrap text-xs">{dateFr(a.created_at)} {timeFr(a.created_at)}</td>
                <td className="p-3">{a.actor_name}<span className="block text-xs text-muted">{ROLE[a.actor_role] || 'Automatique'}</span></td>
                <td className="p-3"><span className={`chip font-mono text-[11px] ${tone(a.action)}`}>{a.action}</span></td>
                <td className="p-3 font-mono text-xs">{a.target}</td><td className="p-3 font-mono text-xs text-muted">#{a.hash?.slice(0, 8)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
