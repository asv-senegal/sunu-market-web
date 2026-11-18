import { Form, Link, useLoaderData, useRouteLoaderData } from 'react-router';
import { BadgeCheck, MessageCircle, HandCoins, Store, Search, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import { api } from '~/lib/api.server';
import { ListingCard, AdBanner } from '~/components/ui';
import { CAT_IMG, CAT_ICON, catHref, type Cat } from '~/components/Shell';
import { HeroSlider, Carousel, CountUp, stagger, type Slide } from '~/components/motion';

export const meta = () => [
  { title: 'Sunu-Market : Le Centre Commercial En Ligne De Dakar' },
  { name: 'description', content: 'Achetez et vendez entre membres vérifiés à Dakar. Échangez dans SM-Chat, payez directement par Wave, Orange Money ou en espèces.' },
];

export async function loader({ request }: { request: Request }) {
  const [featured, recent, shops, featuredShops, ads] = await Promise.all([
    api(request, '/listings?sort=relevance'), api(request, '/listings?sort=recent'), api(request, '/shops'),
    api(request, '/shops?sort=featured'), api(request, '/ads?placement=home'),
  ]);
  return {
    featured: (featured.data.items || []).filter((l: any) => l.featured).slice(0, 10),
    recent: (recent.data.items || []).slice(0, 12),
    total: recent.data.total || 0,
    shops: (featuredShops.data.items?.length ? featuredShops.data.items : shops.data.items || []).slice(0, 8),
    featuredShops: !!featuredShops.data.items?.length,
    shopCount: shops.data.items?.length || 0,
    ads: ads.data.items || [],
  };
}

const SLIDES: Slide[] = [
  { img: '/demo/artisan_stall.jpg', kicker: 'Marketplace Entre Membres Vérifiés', title: 'Le Centre Commercial En Ligne De Dakar', text: 'Chaque commerçant y tient sa boutique. Trouvez un article, discutez dans SM-Chat et payez directement le vendeur, sans commission.', cta: 'Voir Les Boutiques', to: '/boutiques' },
  { img: '/demo/print_dress.jpg', kicker: 'Mode Et Tenues Traditionnelles', title: 'Boubous, Wax Et Bazin De Nos Ateliers', text: 'Des couturières et des créateurs de vos quartiers, des tenues pour la Tabaski, la Korité et chaque jour.', cta: 'Découvrir Femmes', to: '/c/femmes' },
  { img: '/demo/phone_table.jpg', kicker: 'Électronique Testée', title: 'Téléphones Et Accessoires Entre Membres', text: 'Comparez les annonces, posez vos questions dans SM-Chat et vérifiez l’article avant de payer à la remise.', cta: 'Voir L’Électronique', to: '/c/electronique' },
  { img: '/demo/tailor_sewing.jpg', kicker: 'Ouvrez Votre Boutique', title: '14 Jours D’Essai, Puis 2 500 FCFA Par An', text: 'Publiez vos articles, recevez vos commandes dans SM-Chat et laissez SM-IA répondre quand vous êtes occupé.', cta: 'Ouvrir Ma Boutique', to: '/ma-boutique' },
];

const TRUST = [
  [BadgeCheck, 'Comptes Vérifiés', 'Chaque membre passe une vérification d’identité.'],
  [MessageCircle, 'SM-Chat Intégré', 'Discutez et commandez sans quitter l’application.'],
  [HandCoins, 'Zéro Commission', 'Payez directement le commerçant : Wave, Orange Money, espèces.'],
  [Store, 'Boutiques Locales', 'Des commerçants de votre quartier, partout à Dakar.'],
] as const;

export default function Home() {
  const d = useLoaderData<typeof loader>();
  const { cats } = useRouteLoaderData('root') as { cats: Cat[] };
  return (
    <>
      <div className="container-x pt-5 md:pt-8">
        <HeroSlider slides={SLIDES}>
          <Form action="/recherche" className="flex gap-2 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
              <input name="q" placeholder="Boubou, téléphone, karité…" className="input pl-9 text-ink shadow-lg" aria-label="Rechercher" />
            </div>
            <button className="btn-primary shadow-lg press">Rechercher</button>
          </Form>
        </HeroSlider>
        {/* Sur téléphone, la recherche passe sous le carrousel pour ne pas masquer le bouton */}
        <Form action="/recherche" className="md:hidden flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input name="q" placeholder="Boubou, téléphone, karité…" className="input pl-9" aria-label="Rechercher" />
          </div>
          <button className="btn-primary press">Rechercher</button>
        </Form>
      </div>

      <section className="container-x mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TRUST.map(([Icon, t, txt], i) => (
          <div key={t} className="card p-4 flex gap-3 lift" {...stagger(i)}>
            <span className="size-10 shrink-0 rounded-xl bg-turquoise-50 text-turquoise flex items-center justify-center"><Icon className="size-5" /></span>
            <div><p className="font-semibold text-sm text-indigo">{t}</p><p className="text-xs text-muted mt-0.5 hidden sm:block">{txt}</p></div>
          </div>
        ))}
      </section>

      <Section title="Explorer Par Catégorie" link="/categories">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {cats.map((c, i) => {
            const Icon = CAT_ICON[c.icon];
            return (
              <Link prefetch="intent" key={c.slug} to={catHref(c)} viewTransition className="group relative aspect-square rounded-2xl overflow-hidden" {...stagger(i, 40)}>
                <img src={`/demo/${CAT_IMG[c.slug]}.jpg`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <span className="absolute inset-0 bg-gradient-to-t from-indigo/90 via-indigo/20 to-transparent group-hover:from-orange/85 transition-colors duration-500" />
                <Icon className="absolute top-2.5 left-2.5 size-5 text-white/90 -translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition duration-300" />
                <span className="absolute bottom-2 left-2 right-2 text-white text-xs sm:text-sm font-semibold leading-tight">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </Section>

      {d.ads.length > 0 && <div className="container-x mt-10"><AdBanner ads={d.ads} /></div>}

      {d.featured.length > 0 && (
        <Section title="Mis En Avant" link="/recherche" icon={<Sparkles className="size-5 text-orange" />}>
          <Carousel label="Articles mis en avant">
            {d.featured.map((l: any, i: number) => <ListingCard key={l.id} l={l} i={i} className="snap-start shrink-0 w-[44%] sm:w-[30%] lg:w-[19%]" />)}
          </Carousel>
        </Section>
      )}

      <Section title="Nouveautés" link="/recherche?sort=recent">
        <Carousel label="Nouveautés">
          {d.recent.map((l: any, i: number) => <ListingCard key={l.id} l={l} i={i} className="snap-start shrink-0 w-[44%] sm:w-[30%] lg:w-[19%]" />)}
        </Carousel>
      </Section>

      <section className="container-x mt-14">
        <div className="rounded-3xl bg-indigo text-white p-6 md:p-10 grid md:grid-cols-4 gap-6 relative overflow-hidden" data-reveal="zoom">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-orange/20 blur-2xl floaty" aria-hidden="true" />
          {[[d.total, 'Articles En Ligne'], [d.shopCount, 'Boutiques Vérifiées'], [12, 'Catégories'], [0, 'FCFA De Commission']].map(([v, l], i) => (
            <div key={String(l)} {...stagger(i, 100)}>
              <p className="font-display text-4xl md:text-5xl font-bold text-orange-50"><CountUp value={Number(v)} /></p>
              <p className="text-sm text-white/75 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {d.shops.length > 0 && (
        <Section title={d.featuredShops ? 'Boutiques À La Une' : 'Boutiques À Découvrir'} link="/boutiques">
          <Carousel label="Boutiques">
            {d.shops.map((s: any, i: number) => (
              <Link prefetch="intent" key={s.id} to={`/b/${s.slug}`} viewTransition className="card overflow-hidden lift snap-start shrink-0 w-[78%] sm:w-[45%] lg:w-[24%]" {...stagger(i)}>
                <div className="h-32 overflow-hidden"><img src={s.banner || '/demo/artisan_stall.jpg'} alt="" className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" /></div>
                <div className="p-4">
                  <p className="font-display font-semibold text-indigo flex items-center gap-1">{s.name}<BadgeCheck className="size-4 text-turquoise" /></p>
                  <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><MapPin className="size-3" />{s.quarter} · {s.listings} annonces</p>
                </div>
              </Link>
            ))}
          </Carousel>
        </Section>
      )}

      <section className="container-x mt-14">
        <div className="card p-6 md:p-10 grid md:grid-cols-4 gap-6">
          <h2 className="font-display text-2xl font-bold text-indigo md:col-span-1" data-reveal="left">Comment Ça Marche</h2>
          {[['Inscrivez-Vous', 'Créez votre compte et faites vérifier votre identité.'], ['Échangez', 'Posez vos questions et commandez dans SM-Chat.'], ['Payez Le Vendeur', 'Réglez directement à la remise : Wave, Orange Money ou espèces.']].map(([t, txt], i) => (
            <div key={t} {...stagger(i + 1, 120)}>
              <span className="size-9 rounded-full bg-orange text-white font-display font-bold flex items-center justify-center">{i + 1}</span>
              <p className="font-semibold text-ink mt-3">{t}</p><p className="text-sm text-muted mt-1">{txt}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Section({ title, link, icon, children }: { title: string; link?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="container-x mt-12">
      <div className="flex items-center justify-between mb-4" data-reveal="">
        <h2 className="font-display text-xl md:text-2xl font-bold text-indigo flex items-center gap-2">{icon}{title}</h2>
        {link && <Link prefetch="intent" to={link} className="text-sm font-semibold text-orange inline-flex items-center group">Tout Voir<ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" /></Link>}
      </div>
      {children}
    </section>
  );
}
