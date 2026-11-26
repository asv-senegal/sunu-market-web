import { Link, useLoaderData } from 'react-router';
import { apiOrThrow, requireMe } from '~/lib/api.server';
import { REPORT_REASON, dateFr } from '~/lib/format';
import { Empty, PageTitle } from '~/components/ui';

export const meta = () => [{ title: 'Mes Signalements | Sunu-Market' }];
export async function loader({ request }: any) { await requireMe(request); return apiOrThrow(request, '/reports'); }

export default function MyReports() {
  const { items } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-3xl w-full">
      <PageTitle title="Mes Signalements" sub="Ceux que vous avez faits et ceux qui vous concernent." />
      {items.length ? (
        <div className="card divide-y divide-sable-dark">
          {items.map((r: any) => (
            <Link prefetch="intent" key={r.id} to={`/signalements/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-sable">
              <div className="flex-1"><p className="font-semibold text-sm">{r.ref} · {REPORT_REASON[r.reason]}</p><p className="text-xs text-muted">{r.mine ? 'Fait par vous' : 'Vous concerne'} · {dateFr(r.created_at)}</p></div>
              <span className={`chip ${r.status === 'open' ? 'bg-orange-50 text-orange-dark' : 'bg-turquoise-50 text-turquoise'}`}>{r.status === 'open' ? 'En Examen' : 'Traité'}</span>
            </Link>
          ))}
        </div>
      ) : <Empty title="Aucun Signalement" />}
    </div>
  );
}
