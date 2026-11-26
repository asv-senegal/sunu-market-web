// Fichier de démarrage pour l'hébergement Node.js de cPanel / N0C (Phusion Passenger).
// Même serveur que « react-router-serve » (compression, fichiers statiques, journal), avec une différence :
// sur N0C, LiteSpeed reçoit les visiteurs en HTTPS et transmet la requête à Node en HTTP. React Router compare
// l'adresse de la requête avec l'en-tête Origin du navigateur avant chaque formulaire (protection CSRF) :
// sans les en-têtes du proxy, il voit « http » au lieu de « https » et refuse tout formulaire (400 Bad Request).
// Les variables (API_URL, SESSION_SECRET) viennent du fichier .env placé à côté de ce fichier sur le serveur.
const path = require('node:path');
const { pathToFileURL } = require('node:url');

try { process.loadEnvFile(path.join(__dirname, '.env')); } catch { /* variables fournies par l'hébergeur */ }
process.env.NODE_ENV ??= 'production';

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('@react-router/express');

const production = process.env.NODE_ENV === 'production';
const client = path.join(__dirname, 'build', 'client');

async function start() {
  const build = await import(pathToFileURL(path.join(__dirname, 'build', 'server', 'index.js')).href);
  const app = express();
  app.disable('x-powered-by');

  // Le site n'est joignable que par le proxy de l'hébergeur : on lit X-Forwarded-Proto / X-Forwarded-Host.
  app.set('trust proxy', true);
  // Si le proxy n'indique pas le protocole, on considère le HTTPS en production
  // (le site l'exige de toute façon : le cookie de connexion n'est envoyé qu'en HTTPS).
  if (production && process.env.ASSUME_HTTPS !== '0') {
    app.use((req, _res, next) => {
      if (!req.headers['x-forwarded-proto']) req.headers['x-forwarded-proto'] = 'https';
      next();
    });
  }
  // Nom public transmis par le proxy : il remplace l'en-tête Host interne, sinon l'adaptateur de React Router
  // garderait le port interne (ex. « sunumarket.rodingit.com:3000 ») et l'adresse ne correspondrait plus.
  app.use((req, _res, next) => {
    const forwardedHost = req.get('x-forwarded-host')?.split(',')[0].trim();
    if (forwardedHost) req.headers.host = forwardedHost;
    next();
  });
  // Diagnostic : un formulaire dont l'origine ne correspond toujours pas à l'adresse vue par le serveur
  // sera refusé par React Router ; on l'écrit dans le journal pour corriger la configuration.
  app.use((req, _res, next) => {
    const origin = req.get('origin');
    if (req.method !== 'GET' && req.method !== 'HEAD' && origin && origin !== 'null') {
      const seen = `${req.protocol}://${req.get('host')}`;
      if (origin !== seen) console.warn(`[origine] formulaire refusé : Origin=${origin}, adresse vue=${seen}`);
    }
    next();
  });

  app.use(compression());
  app.use('/assets', express.static(path.join(client, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(client, { maxAge: '1h' }));
  app.use(morgan('tiny'));
  app.all('*', createRequestHandler({ build, mode: process.env.NODE_ENV }));

  // Passenger choisit lui-même le port ; PORT sert aux essais en local
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`[sunu-market-web] prêt sur le port ${port}`));
}

start().catch((err) => {
  console.error('Démarrage du site impossible :', err);
  process.exit(1);
});
