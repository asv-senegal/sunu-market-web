import { API_URL } from './env.server';
import { logApiUnreachable } from './api.server';
let cache: { at: number; items: any[] } | null = null;
// Les catégories changent rarement : mise en cache 5 minutes côté serveur.
// Si l'API ne répond pas, on garde la dernière liste connue (ou une liste vide) : l'en-tête ne fait jamais planter le site.
export async function getCategories() {
  if (cache && Date.now() - cache.at < 300_000) return cache.items;
  const url = `${API_URL}/api/categories`;
  try {
    const r = await fetch(url);
    if (!r.ok) return cache?.items || [];
    cache = { at: Date.now(), items: (await r.json()).items };
    return cache.items;
  } catch (err) {
    logApiUnreachable(url, err);
    return cache?.items || [];
  }
}
