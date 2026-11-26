import { redirect } from 'react-router';
// Ancienne adresse du profil : redirection permanente vers l'espace membre
export const loader = () => redirect('/compte', 301);
