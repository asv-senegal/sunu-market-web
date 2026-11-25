#!/usr/bin/env bash
# Installation et mise à jour du site sur le serveur (N0C / cPanel), depuis le terminal.
# Avant : activez l'environnement Node de l'application (commande affichée dans N0C → Node.js), par exemple
#   source ~/nodevenv/sunumarketweb/22/bin/activate && cd ~/sunumarketweb
# Puis : bash scripts/server-update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }
fail() { printf '\n\033[31mArrêt : %s\033[0m\n' "$1"; exit 1; }

# ---------- Vérifications ----------
command -v node >/dev/null || fail "node introuvable : activez d'abord l'environnement Node (voir SETUP.md, étape 4)."
node -e 'process.exit(+process.versions.node.split(".")[0] >= 22 ? 0 : 1)' \
  || fail "Node $(node -v) actif : il faut Node 22 ou plus. Activez l'environnement Node de l'application (voir SETUP.md)."
if [ -d node_modules ] && [ ! -L node_modules ]; then
  fail "node_modules est un vrai dossier : supprimez-le (rm -rf node_modules), réactivez l'environnement Node, puis relancez."
fi
[ -f .env ] || fail ".env absent : créez-le (voir SETUP.md, étape 5)."

# ---------- Code ----------
if [ -d .git ]; then
  say "Récupération du code (git pull)"
  git pull --ff-only
fi

# ---------- Dépendances : le build a besoin des dépendances de développement (Vite, React Router) ----------
say "Installation des dépendances"
npm install --include=dev --no-audit --no-fund

# ---------- Build ----------
say "Construction du site (npm run build)"
npm run build
[ -f build/server/index.js ] || fail "build/server/index.js absent après le build."

# ---------- Redémarrage (Passenger surveille tmp/restart.txt) ----------
mkdir -p tmp && touch tmp/restart.txt
say "Site à jour. Il redémarre à la prochaine visite."
