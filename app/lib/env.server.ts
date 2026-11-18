import { fileURLToPath } from 'node:url';
// Charge le fichier .env de la racine du projet en développement
try { process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url))); } catch { /* variables déjà fournies */ }
export const API_URL = process.env.API_URL || 'http://localhost:4000';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret';
