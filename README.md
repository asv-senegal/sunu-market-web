# Sunu-Market : site web (frontend)

Site et application web de Sunu-Market, le centre commercial en ligne de Dakar. Ce dépôt contient uniquement l'interface ; les données viennent de l'API (dépôt **sunu-market-api**). Document confidentiel, réservé à l'équipe.

## Technologies

React 19, React Router 7 (mode framework, rendu serveur SSR), Vite, Tailwind CSS 4, icônes Lucide.

Le navigateur ne parle qu'à ce serveur web : les loaders et actions appellent l'API côté serveur avec le jeton de session (cookie httpOnly signé). L'API n'est donc jamais exposée au navigateur et il n'y a pas de CORS à gérer.

## Démarrage

Prérequis : Node.js 22 ou plus, et l'API **sunu-market-api** lancée (par défaut sur http://localhost:4000).

```bash
npm install
cp .env.example .env      # API_URL et SESSION_SECRET
npm run dev               # développement : http://localhost:5173
```

| Commande | Rôle |
|---|---|
| `npm run dev` | Développement avec rechargement à chaud (plus lent, compile à la demande) |
| `npm run preview` | Construit puis lance la version de production : **c'est elle qui donne la vraie fluidité** |
| `npm run build` puis `npm start` | Production (port `PORT`, 3000 par défaut) |
| `npm run typecheck` | Vérification des types |

## Organisation

```
app/root.tsx            mise en page, en-tête, pied de page, barre de progression
app/routes.ts           liste des routes (36 écrans de la maquette v3)
app/routes/             pages publiques, seller/ (Ma Boutique), admin/ (Espace Administrateur)
app/components/         Shell (en-tête, menu, pied de page), ui, Select, motion, OrderCard
app/lib/                api.server (appels à l'API), session.server, format
public/demo/            photos de démonstration (Pexels, voir CREDITS-pexels.txt)
```

## Composants clés

- **`Select`** (`app/components/Select.tsx`) : liste déroulante de la charte, à utiliser à la place de `<select>`.
  - Accessible au clavier (flèches, Entrée, Échap, première lettre), recherche intégrée au-delà de 10 options.
  - Compatible avec les formulaires (`name`, `required`), mode contrôlé (`value`, `onChange`) ou non (`defaultValue`).
  - `autoSubmit` envoie le formulaire à chaque choix (filtres du catalogue).
  - Panneau du bas sur téléphone, s'ouvre vers le haut s'il manque de place.
  ```tsx
  <Select name="quarter" options={QUARTERS} placeholder="Choisir votre quartier" required />
  <Select value={cat} onChange={setCat} options={[{ value: 'femmes', label: 'Femmes', hint: 'Mode et beauté' }]} />
  ```
- **`motion`** : apparitions au défilement, carrousels, compteurs, anneaux de progression.

## Mise en ligne

Déploiement automatique sur PlanetHoster N0C par GitHub Actions (build, FTP, SSH) : voir **[DEPLOYMENT.md](DEPLOYMENT.md)** et `.github/workflows/deploy.yml`. Démarrage par Passenger : `server.cjs`.

## Fluidité

- Préchargement des pages au survol ou au toucher des liens (`prefetch="intent"`).
- Le profil et le menu ne sont pas rechargés à chaque changement de page.
- Animations courtes (0,2 à 0,45 s), désactivées si l'appareil demande moins d'animations.
- Images en chargement différé, photos compressées par l'API.

Pour juger la fluidité, utilisez `npm run preview` : le mode `dev` compile chaque page au premier affichage.
