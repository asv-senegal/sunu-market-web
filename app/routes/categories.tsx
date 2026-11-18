// Menu des catégories sur téléphone (liste dépliable)
import { Link, useRouteLoaderData } from 'react-router';
import { ChevronDown } from 'lucide-react';
import { CAT_ICON, catHref, type Cat } from '~/components/Shell';

export const meta = () => [{ title: 'Catégories | Sunu-Market' }];

export default function Categories() {
  const { cats } = useRouteLoaderData('root') as { cats: Cat[] };
  return (
    <div className="container-x py-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-indigo mb-4">Catégories</h1>
      <div className="card divide-y divide-sable-dark">
        {cats.map((c) => {
          const Icon = CAT_ICON[c.icon];
          return (
            <details key={c.slug} className="group">
              <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
                <span className="size-9 rounded-xl bg-indigo-50 text-indigo flex items-center justify-center"><Icon className="size-5" /></span>
                <span className="font-semibold flex-1">{c.name}</span>
                <ChevronDown className="size-4 text-muted group-open:rotate-180 transition-transform" />
              </summary>
              <ul className="pb-3 px-4 grid grid-cols-1 gap-1">
                <li><Link prefetch="intent" to={catHref(c)} className="block py-2 pl-12 text-sm font-semibold text-orange">Tout Voir</Link></li>
                {c.subs.map((s) => <li key={s.slug}><Link prefetch="intent" to={catHref(c, s.slug)} className="block py-2 pl-12 text-sm text-ink/85">{s.name}</Link></li>)}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
