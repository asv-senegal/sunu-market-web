import { redirect } from 'react-router';

// Les navigateurs demandent /favicon.ico même avec <link rel="icon">. Renvoie vers l'icône SVG.
export const loader = () => redirect('/favicon.svg', 301);
