// Retour de paiement (Wave, Orange Money) et suivi d'un paiement déclaré
import { Link, useLoaderData, useRevalidator } from 'react-router';
import { useEffect } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { apiOrThrow } from '~/lib/api.server';
import { fcfa, dateFr } from '~/lib/format';

export const meta = () => [{ title: 'Paiement | Sunu-Market' }];
export const loader = ({ request, params }: any) => apiOrThrow(request, `/payments/${params.ref}`);
const NEXT: Record<string, string> = { subscription: '/ma-boutique/abonnement', credits: '/ma-boutique/sm-ia', featured: '/ma-boutique/visibilite', campaign: '/ma-boutique/visibilite', ad: '/ma-boutique/visibilite' };

export default function Payment() {
  const { payment: p } = useLoaderData<typeof loader>();
  const rv = useRevalidator();
  useEffect(() => {
    if (p.status !== 'pending' || p.provider === 'manual') return;
    const t = setInterval(() => rv.state === 'idle' && rv.revalidate(), 4000);
    return () => clearInterval(t);
  }, [p.status, p.provider, rv]);
  const S = p.status === 'paid' ? { I: CheckCircle2, c: 'text-turquoise', t: 'Paiement Confirmé' }
    : p.status === 'pending' ? { I: Clock, c: 'text-orange', t: p.provider === 'manual' ? 'Paiement En Cours De Vérification' : 'En Attente De Confirmation' }
    : { I: XCircle, c: 'text-red-700', t: 'Paiement Non Abouti' };
  return (
    <div className="container-x py-12 max-w-lg">
      <div className="card p-8 text-center animate-fade-up">
        <S.I className={`size-16 mx-auto ${S.c} ${p.status === 'paid' ? 'animate-pop' : ''}`} />
        <h1 className="font-display text-2xl font-bold text-indigo mt-4">{S.t}</h1>
        <p className="text-muted mt-1">{p.label} · {p.ref}</p>
        <p className="font-display text-3xl font-bold text-orange mt-4">{fcfa(p.total_fcfa)}</p>
        {p.commission_fcfa > 0 && <p className="text-xs text-muted">dont {fcfa(p.commission_fcfa)} de commission</p>}
        {p.status === 'pending' && p.provider === 'manual' && <p className="text-sm text-muted mt-4">L’équipe vérifie votre référence {p.provider_ref} sur le relevé. Vous recevrez une notification.</p>}
        {p.status === 'pending' && p.checkout_url && <a href={p.checkout_url} className="btn-primary mt-5">Reprendre Le Paiement</a>}
        {p.paid_at && <p className="text-sm text-muted mt-3">Payé le {dateFr(p.paid_at)}</p>}
        <Link prefetch="intent" to={NEXT[p.purpose]} className="btn-ghost mt-6">Continuer</Link>
      </div>
    </div>
  );
}
