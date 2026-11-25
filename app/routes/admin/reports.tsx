// Liste des signalements, triés par échéance
import { Link, useLoaderData } from 'react-router';
import { Clock, Sparkles } from 'lucide-react';
import { apiOrThrow } from '~/lib/api.server';
import { REPORT_REASON, dateFr } from '~/lib/format';
import { Empty, Toolbar } from '~/components/ui';

export const handle = { title: 'Signalements' };
export async function loader({ request }: any) {
  const st = new URL(request.url).searchParams.get('statut') || 'open';
  return { ...(await apiOrThrow(request, `/admin/reports?status=${st}`)), st };
}
const DEC: Record<string, string> = { dismiss: 'Classé', warn: 'Avertissement', remove: 'Annonce Retirée', suspend: 'Compte Suspendu' };

export default function Reports() {
  const { items, st } = useLoaderData<typeof loader>();
  return (
    <>
      <Toolbar sub="Paiement direct : aucun fonds détenu. Les décisions portent sur l’annonce ou le compte.">
        <div className="flex gap-1">{[['open', 'Ouverts'], ['closed', 'Traités']].map(([k, l]) => <Link prefetch="intent" key={k} to={`?statut=${k}`} className={`btn btn-sm ${st === k ? 'bg-indigo text-white' : 'btn-ghost'}`}>{l}</Link>)}</div>
      </Toolbar>
      {items.length ? (
        <div className="space-y-3">
          {items.map((r: any, i: number) => {
            const h = Math.round((new Date(r.due_at).getTime() - Date.now()) / 36e5);
            return (
              <Link prefetch="intent" key={r.id} to={`/admin/signalements/${r.id}`} viewTransition className="card p-4 flex flex-wrap items-center gap-3 lift" data-reveal="" style={{ '--d': `${Math.min(i, 8) * 40}ms` } as React.CSSProperties}>
                <div className="flex-1 min-w-[220px]">
                  <p className="font-semibold">{r.ref} · {REPORT_REASON[r.reason]}</p>
                  <p className="text-xs text-muted flex items-center gap-1">{!r.reporter_id && <Sparkles className="size-3 text-turquoise" />}{r.reporter_name} → {r.reported_name || '—'} · {dateFr(r.created_at)}</p>
                </div>
                {r.status === 'open'
                  ? <span className={`chip ${h < 12 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-dark'}`}><Clock className="size-3" />{h > 0 ? `${h} h restantes` : 'Délai dépassé'}</span>
                  : <span className="chip bg-turquoise-50 text-turquoise">{DEC[r.decision]}</span>}
              </Link>
            );
          })}
        </div>
      ) : <Empty title="Aucun Signalement" />}
    </>
  );
}
