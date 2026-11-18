// Proxy des images publiques de l'API (photos d'annonces)
import { API_URL } from '~/lib/env.server';
export async function loader({ params }: any) {
  const r = await fetch(`${API_URL}/files/${params['*']}`);
  if (!r.ok) return new Response('Introuvable', { status: 404 });
  return new Response(r.body, { headers: { 'Content-Type': r.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=604800' } });
}
