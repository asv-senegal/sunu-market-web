import { redirect, data } from 'react-router';
import { API_URL } from './env.server';
import { getToken } from './session.server';

export type ApiResult<T = any> = { ok: boolean; status: number; data: T };

// Clé d'idempotence d'un formulaire : créée par le loader, renvoyée dans un champ caché « idem ».
// Un double clic ou un formulaire renvoyé réutilise la même clé : l'API ne crée rien deux fois.
export const newIdem = () => crypto.randomUUID();
export const idemOf = (f: FormData) => {
  const v = f.get('idem');
  return typeof v === 'string' && /^[A-Za-z0-9_-]{8,100}$/.test(v) ? v : undefined;
};

// Appel à l'API Express depuis le serveur web (loaders et actions)
export async function api<T = any>(request: Request, path: string, init: { method?: string; json?: unknown; form?: FormData; idem?: string } = {}): Promise<ApiResult<T>> {
  const token = await getToken(request);
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.idem) headers['Idempotency-Key'] = init.idem;
  let body: BodyInit | undefined;
  if (init.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(init.json); }
  if (init.form) body = init.form;
  const method = init.method || (body ? 'POST' : 'GET');
  // Même demande déjà en cours (double clic) : on attend sa réponse au lieu d'afficher une erreur
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${API_URL}/api${path}`, { method, headers, body });
    const d = await res.json().catch(() => ({}));
    if (res.status === 409 && d?.code === 'request_in_progress' && init.idem && attempt < 30) {
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    return { ok: res.ok, status: res.status, data: d };
  }
}

// Lecture obligatoire : redirige vers la connexion ou la vérification si nécessaire
export async function apiOrThrow<T = any>(request: Request, path: string): Promise<T> {
  const r = await api<T>(request, path);
  if (r.ok) return r.data;
  const url = new URL(request.url);
  if (r.status === 401) throw redirect(`/connexion?suite=${encodeURIComponent(url.pathname + url.search)}`);
  if (r.status === 403 && (r.data as any)?.code === 'not_verified') throw redirect('/verification');
  throw data((r.data as any)?.error || 'Erreur', { status: r.status });
}

export async function getMe(request: Request) {
  if (!(await getToken(request))) return null;
  const r = await api(request, '/me');
  return r.ok ? r.data : null;
}

export async function requireMe(request: Request, opts: { verified?: boolean; role?: string[] } = {}) {
  const me = await getMe(request);
  const url = new URL(request.url);
  if (!me) throw redirect(`/connexion?suite=${encodeURIComponent(url.pathname + url.search)}`);
  if (opts.verified !== false && me.user.verificationStatus !== 'verified') throw redirect('/verification');
  if (opts.role && !opts.role.includes(me.user.role)) throw redirect('/');
  return me;
}

// Convertit la réponse d'erreur de l'API pour un formulaire
export const formError = (r: ApiResult) => ({ error: r.data?.error || 'Une erreur est survenue.', fields: r.data?.fields || {} });
