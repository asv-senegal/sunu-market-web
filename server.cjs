// Fichier de démarrage pour l'hébergement Node.js de cPanel / N0C (Phusion Passenger).
// Lance le serveur de production de React Router (même chose que « npm start ») sur le build envoyé par GitHub.
// Les variables (API_URL, SESSION_SECRET) viennent du fichier .env placé à côté de ce fichier sur le serveur.
const path = require('node:path');

try { process.loadEnvFile(path.join(__dirname, '.env')); } catch { /* variables fournies par l'hébergeur */ }
process.env.NODE_ENV ??= 'production';

// react-router-serve lit le chemin du build dans argv[2] ; Passenger gère lui-même le port d'écoute.
process.argv[2] = path.join(__dirname, 'build', 'server', 'index.js');
// Le paquet n'expose pas bin.js dans « exports » : on le charge par son chemin absolu
const serveDir = path.dirname(require.resolve('@react-router/serve/package.json'));
require(path.join(serveDir, 'bin.js'));
