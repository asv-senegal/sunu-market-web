import { API_URL } from './env.server';
let cache: { at: number; items: any[] } | null = null;
// Les catégories changent rarement : mise en cache 5 minutes côté serveur
export async function getCategories() {
  if (cache && Date.now() - cache.at < 300_000) return cache.items;
  const r = await fetch(`${API_URL}/api/categories`);
  if (!r.ok) return cache?.items || [];
  cache = { at: Date.now(), items: (await r.json()).items };
  return cache.items;
}
