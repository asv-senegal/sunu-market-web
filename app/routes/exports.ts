// Téléchargements CSV (commandes, journal SM-IA, revenus, audit) avec le jeton de session
import { API_URL } from '~/lib/env.server';
import { getToken } from '~/lib/session.server';
const MAP: Record<string, string> = {
  'commandes.csv': '/me/shop/orders.csv', 'journal-sm-ia.csv': '/me/smia/journal.csv',
  'revenus.csv': '/admin/revenue.csv', 'audit.csv': '/admin/audit.csv',
};
export async function loader({ request, params }: any) {
  const path = MAP[params.name];
  if (!path) return new Response('Introuvable', { status: 404 });
  const r = await fetch(`${API_URL}/api${path}`, { headers: { Authorization: `Bearer ${await getToken(request)}` } });
  if (!r.ok) return new Response('Accès refusé', { status: r.status });
  return new Response(r.body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${params.name}"` } });
}
