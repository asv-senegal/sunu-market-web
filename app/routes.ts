import { type RouteConfig, index, route, layout } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('categories', 'routes/categories.tsx'),
  route('recherche', 'routes/catalog.tsx', { id: 'search' }),
  route('c/:cat/:sub?', 'routes/catalog.tsx', { id: 'category' }),
  route('a/:id', 'routes/listing.tsx'),
  route('a/:id/commander', 'routes/order-new.tsx'),
  route('boutiques', 'routes/shops.tsx'),
  route('b/:slug', 'routes/shop.tsx'),
  route('pages/:slug', 'routes/page.tsx'),

  route('connexion', 'routes/login.tsx'),
  route('inscription', 'routes/register.tsx'),
  route('verification', 'routes/verification.tsx'),
  route('deconnexion', 'routes/logout.tsx'),

  route('mot-de-passe-oublie', 'routes/forgot.tsx'),

  route('messages', 'routes/messages.tsx', [route(':id', 'routes/messages.thread.tsx')]),
  route('paiement/:ref', 'routes/payment.tsx'),
  route('profil', 'routes/account/profil-redirect.tsx'),

  // Espace membre (P13 à P19) : barre latérale du compte
  layout('routes/account/layout.tsx', [
    route('compte', 'routes/profile.tsx'),
    route('compte/favoris', 'routes/account/favorites.tsx'),
    route('compte/securite', 'routes/account/security.tsx'),
    route('commandes', 'routes/orders.tsx'),
    route('commandes/:id', 'routes/order.tsx'),
    route('commandes/:id/avis', 'routes/order-review.tsx'),
    route('signalements', 'routes/my-reports.tsx'),
    route('signalements/:id', 'routes/my-report.tsx'),
    route('signaler', 'routes/report.tsx'),
    route('notifications', 'routes/notifications.tsx'),
  ]),

  route('ma-boutique', 'routes/seller/layout.tsx', [
    index('routes/seller/dashboard.tsx'),
    route('annonces', 'routes/seller/listings.tsx'),
    route('annonces/nouvelle', 'routes/seller/new-listing.tsx'),
    route('commandes', 'routes/seller/orders.tsx'),
    route('abonnement', 'routes/seller/subscription.tsx'),
    route('visibilite', 'routes/seller/visibility.tsx'),
    route('sm-ia', 'routes/seller/smia.tsx'),
    route('sm-ia/commandes', 'routes/seller/smia-orders.tsx'),
    route('sm-ia/recharger', 'routes/seller/recharge.tsx'),
    route('avis', 'routes/seller/reviews.tsx'),
    route('parametres', 'routes/seller/settings.tsx'),
    route('sm-chat', 'routes/messages.tsx', { id: 'seller-chat' }, [route(':id', 'routes/messages.thread.tsx', { id: 'seller-chat-thread' })]),
  ]),

  route('admin', 'routes/admin/layout.tsx', [
    index('routes/admin/dashboard.tsx'),
    route('verifications', 'routes/admin/verifications.tsx'),
    route('annonces', 'routes/admin/listings.tsx'),
    route('signalements', 'routes/admin/reports.tsx'),
    route('signalements/:id', 'routes/admin/report.tsx'),
    route('revenus', 'routes/admin/revenue.tsx'),
    route('sm-ia', 'routes/admin/smia.tsx'),
    route('journal', 'routes/admin/audit.tsx'),
    route('parametres', 'routes/admin/settings.tsx'),
    route('recherche', 'routes/admin/search.tsx'),
  ]),

  // Ressources : images de l'API et fichiers privés de vérification (administration seulement)
  route('favicon.ico', 'routes/favicon.ts'),
  route('files/*', 'routes/files.ts'),
  route('kyc/:id/:kind', 'routes/kyc.ts'),
  route('preuve/:id', 'routes/evidence.ts'),
  route('pub/:id', 'routes/ad-click.ts'),
  route('exports/:name', 'routes/exports.ts'),
] satisfies RouteConfig;
