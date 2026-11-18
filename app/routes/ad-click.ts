// Clic sur une publicité : comptage puis redirection vers la boutique
import { redirect } from 'react-router';
import { api } from '~/lib/api.server';
export async function loader({ request, params }: any) {
  const r = await api(request, `/ads/${params.id}/click`, { method: 'POST' });
  return redirect(r.data?.to || '/');
}
