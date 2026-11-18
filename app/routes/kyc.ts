// Fichiers de vérification : transmis uniquement à l'administration, jamais mis en cache
import { API_URL } from '~/lib/env.server';
import { getToken } from '~/lib/session.server';
export async function loader({ request, params }: any) {
  const token = await getToken(request);
  const r = await fetch(`${API_URL}/api/admin/verifications/${params.id}/file/${params.kind}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return new Response('Accès refusé ou fichier supprimé', { status: r.status });
  return new Response(r.body, { headers: { 'Content-Type': r.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'no-store' } });
}
