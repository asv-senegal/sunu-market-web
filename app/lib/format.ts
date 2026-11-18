export const fcfa = (n: number) => `${Number(n || 0).toLocaleString('fr-FR').replace(/ |\s/g, ' ')} FCFA`;

export const CONDITION: Record<string, string> = { new: 'Neuf', like_new: 'Comme Neuf', good: 'Bon État', fair: 'État Correct' };
export const PAY: Record<string, string> = { wave: 'Wave', orange_money: 'Orange Money', cash: 'Espèces' };
export const DELIVERY: Record<string, string> = { hand: 'Remise En Main Propre', delivery: 'Livraison', pickup: 'Retrait En Boutique' };
export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: 'Nouvelle', cls: 'bg-orange-50 text-orange-dark' },
  accepted: { label: 'Acceptée', cls: 'bg-indigo-50 text-indigo' },
  scheduled: { label: 'Remise Prévue', cls: 'bg-indigo-50 text-indigo' },
  completed: { label: 'Terminée', cls: 'bg-turquoise-50 text-turquoise' },
  declined: { label: 'Refusée', cls: 'bg-red-50 text-red-700' },
  cancelled: { label: 'Annulée', cls: 'bg-gray-100 text-gray-600' },
};
export const REPORT_REASON: Record<string, string> = {
  not_received: 'Article Non Reçu', not_as_described: 'Non Conforme À L’Annonce', scam: 'Tentative D’Arnaque',
  prohibited: 'Article Interdit', behaviour: 'Comportement Inapproprié', other: 'Autre Motif',
};
// Quartiers de Dakar proposés (liste indicative, extensible)
export const QUARTERS = ['Plateau', 'Médina', 'Fann', 'Point E', 'Mermoz', 'Sacré-Cœur', 'Ouakam', 'Ngor', 'Yoff', 'Almadies', 'Grand Yoff',
  'HLM', 'Liberté', 'Dieuppeul', 'Parcelles Assainies', 'Guédiawaye', 'Pikine', 'Thiaroye', 'Keur Massar', 'Rufisque', 'Autre'];

export const dateFr = (d: string | Date) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Dakar' });
export const timeFr = (d: string | Date) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' });
export const ago = (d: string | Date) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'À l’instant';
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`;
  return dateFr(d);
};
// URL d'image : fichiers de l'API servis via /files (proxy), démo servie par le web
export const img = (u?: string | null) => u || '/demo/basket_close.jpg';
