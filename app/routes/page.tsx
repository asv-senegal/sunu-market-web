// Pages d'information du pied de page. Contenus provisoires à compléter par l'équipe.
import { Link, useLoaderData, data } from 'react-router';

const PAGES: Record<string, { title: string; body: string[] }> = {
  'a-propos': { title: 'À Propos De Nous', body: ['Sunu-Market (« notre marché » en wolof) est le centre commercial en ligne de Dakar : chaque commerçant vérifié y tient sa boutique, et chaque membre peut acheter et vendre.', 'Sunu-Market est une start-up sénégalaise incubée par ASV-Sénégal.'] },
  'comment-ca-marche': { title: 'Comment Ça Marche', body: ['1- Inscrivez-vous et faites vérifier votre identité : c’est obligatoire pour garantir des comptes de confiance.', '2- Trouvez un article et échangez avec le commerçant dans SM-Chat.', '3- Envoyez votre commande, convenez de la remise, puis payez directement le commerçant (Wave, Orange Money ou espèces). Sunu-Market ne prend aucune commission sur vos achats.'] },
  abonnement: { title: 'Abonnement', body: ['Acheter sur Sunu-Market est gratuit. L’abonnement concerne uniquement les membres qui ouvrent une boutique.', 'Après 14 jours d’essai gratuit, la boutique coûte 2 500 FCFA par an, payables par Wave ou Orange Money.'] },
  campagnes: { title: 'Lancer Une Campagne', body: ['Les campagnes promotionnelles permettront de faire connaître votre boutique. Tarifs et conditions : à confirmer.'] },
  'mise-en-avant': { title: 'Mettre Un Produit En Avant', body: ['La mise en avant place votre article en tête des résultats, sur l’accueil et dans les espaces stratégiques. Tarifs : à confirmer.'] },
  faq: { title: 'Foire Aux Questions', body: ['Pourquoi la vérification est-elle obligatoire ? Pour que chaque membre sache qu’il échange avec une personne réelle.', 'Sunu-Market encaisse-t-il mon paiement ? Non. Vous payez directement le commerçant ; Sunu-Market ne rembourse pas, mais examine chaque signalement.', 'Mes documents d’identité sont-ils conservés ? Non : ils sont supprimés dès que la vérification est décidée (loi n° 2008-12 sur les données personnelles).'] },
  confidentialite: { title: 'Confidentialité', body: ['Sunu-Market applique la loi n° 2008-12 sur la protection des données personnelles. Nous collectons uniquement les données nécessaires au service. Les pièces d’identité et selfies sont supprimés après la décision de vérification.', 'Politique complète : à rédiger et à faire valider par un juriste.'] },
};

export async function loader({ params }: any) {
  const p = PAGES[params.slug];
  return { slug: params.slug, page: p || { title: params.slug.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' '), body: ['Cette page sera bientôt disponible.'] } };
}
export const meta = ({ data: d }: any) => [{ title: `${d?.page?.title} | Sunu-Market` }];

export default function Page() {
  const { page } = useLoaderData<typeof loader>();
  return (
    <div className="container-x py-10 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-indigo mb-6">{page.title}</h1>
      <div className="card p-6 space-y-4 text-ink/85 leading-relaxed">{page.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      <Link prefetch="intent" to="/" className="btn-ghost mt-6">Retour À L’Accueil</Link>
    </div>
  );
}
