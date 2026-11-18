import { api, formError } from './api.server';
// Action partagée : changement d'état et avis
export async function orderAction(request: Request) {
  const f = await request.formData();
  const id = f.get('id');
  if (f.get('intent') === 'review') {
    const r = await api(request, `/orders/${id}/review`, { json: { rating: Number(f.get('rating')), tags: f.getAll('tags'), comment: f.get('comment') || undefined } });
    return r.ok ? { ok: true, id } : { ...formError(r), id };
  }
  const meetingAt = f.get('meetingAt') ? new Date(String(f.get('meetingAt')) + ':00+00:00').toISOString() : undefined; // Dakar = UTC
  const r = await api(request, `/orders/${id}/status`, { json: { status: f.get('status'), meetingPlace: f.get('meetingPlace') || undefined, meetingAt } });
  return r.ok ? { ok: true, id } : { ...formError(r), id };
}
