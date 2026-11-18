// Preuves d'un signalement : fichiers privés, réservés à la modération
import { API_URL } from '~/lib/env.server';
import { getToken } from '~/lib/session.server';
export async function loader({ request, params }: any) {
  const r = await fetch(`${API_URL}/api/admin/report-evidence/${params.id}`, { headers: { Authorization: `Bearer ${await getToken(request)}` } });
  if (!r.ok) return new Response('Accès refusé', { status: r.status });
  return new Response(r.body, { headers: { 'Content-Type': r.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'no-store' } });
}
