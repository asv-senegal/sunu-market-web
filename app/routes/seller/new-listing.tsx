// Poser une annonce : catégorie à trois niveaux, photos, prix, remise et paiements acceptés
import { Form, useActionData, useNavigation, useRouteLoaderData, redirect, useLoaderData, Link, useFetcher } from 'react-router';
import { useState, useRef, useEffect } from 'react';
import { ImagePlus, X, Sparkles, Camera, Wifi } from 'lucide-react';
import { api, formError, idemOf, newIdem } from '~/lib/api.server';
import { CONDITION, PAY, DELIVERY } from '~/lib/format';
import { Alert, Field, PageTitle } from '~/components/ui';
import type { Cat } from '~/components/Shell';
import { Select } from '~/components/Select';

export const handle = { title: 'Poser Une Annonce' };
export const meta = () => [{ title: 'Poser Une Annonce | Sunu-Market' }];
export async function loader({ request }: any) {
  const r = await api(request, '/me/shop');
  if (!r.ok) return redirect('/ma-boutique');
  return { active: !!r.data.subscription, idem: newIdem() };
}
export async function action({ request }: any) {
  const form = await request.formData();
  // Rédaction par SM-IA (crédits débités au token)
  if (form.get('intent') === 'describe') {
    const r = await api(request, '/me/smia/describe', { json: { title: form.get('title') || undefined, subcategoryId: form.get('subcategoryId') ? Number(form.get('subcategoryId')) : undefined, condition: form.get('condition') || undefined, notes: form.get('description') || undefined }, idem: idemOf(form) });
    return r.ok ? { ai: r.data } : { aiError: r.data.error };
  }
  // Retire les champs de fichiers vides envoyés par le navigateur
  const clean = new FormData();
  for (const [k, v] of form.entries()) if (!(typeof v === 'object' && (v as File).size === 0)) clean.append(k, v);
  const r = await api(request, '/listings', { form: clean });
  return r.ok ? redirect(r.data.draft ? '/ma-boutique/annonces?vue=brouillons' : `/a/${r.data.id}`) : formError(r);
}

export default function NewListing() {
  const { active, idem } = useLoaderData<typeof loader>();
  const { cats } = useRouteLoaderData('root') as { cats: Cat[] };
  const a = useActionData<typeof action>() as any;
  const e = a?.fields || {};
  const busy = useNavigation().state === 'submitting';
  const [cat, setCat] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const ai = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  const aiData = ai.data as any;
  // Insère le texte proposé par SM-IA dans le formulaire (le commerçant garde la main)
  useEffect(() => {
    if (!aiData?.ai || !formRef.current) return;
    (formRef.current.elements.namedItem('title') as HTMLInputElement).value = aiData.ai.title;
    (formRef.current.elements.namedItem('description') as HTMLTextAreaElement).value = aiData.ai.description;
  }, [aiData]);
  const askAI = () => {
    const f = formRef.current!; const fd = new FormData();
    fd.set('intent', 'describe');
    ['title', 'subcategoryId', 'condition', 'description'].forEach((k) => { const v = (f.elements.namedItem(k) as HTMLInputElement)?.value; if (v) fd.set(k, v); });
    ai.submit(fd, { method: 'post' });
  };
  const c = cats.find((x) => x.slug === cat);
  if (!active) return <Alert>Votre abonnement a expiré : renouvelez-le pour publier. <Link prefetch="intent" to="/ma-boutique/abonnement" className="underline font-semibold">Renouveler</Link></Alert>;

  return (
    <>
      <Form ref={formRef} method="post" encType="multipart/form-data" className="grid lg:grid-cols-[300px_1fr] gap-5 items-start animate-fade-up">
        <input type="hidden" name="idem" value={idem} />
        <div className="card p-5 space-y-3 lg:sticky lg:top-24">
          <div><h2 className="font-display font-semibold text-ink">Photos</h2><p className="text-xs text-muted">La première photo sert de couverture (1 à 6).</p></div>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, i) => <img key={p} src={p} alt={`Photo ${i + 1}`} className={`aspect-square w-full rounded-xl object-cover ${i === 0 ? 'ring-2 ring-orange ring-offset-1' : ''}`} loading="lazy" decoding="async" />)}
            <label className="aspect-square rounded-xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 text-muted cursor-pointer hover:border-turquoise hover:text-turquoise transition-colors">
              <Camera className="size-5" /><span className="text-[11px]">Ajouter</span>
              <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple required className="sr-only"
                onChange={(ev) => setPreviews(Array.from(ev.target.files || []).slice(0, 6).map((f) => URL.createObjectURL(f)))} />
            </label>
          </div>
          <p className="text-[11.5px] text-muted">JPEG, PNG ou WebP, 5 Mo maximum chacune.</p>
          <p className="rounded-xl bg-turquoise-50 text-turquoise text-xs p-3 flex gap-2"><Wifi className="size-4 shrink-0" />Photos compressées automatiquement pour économiser vos données.</p>
        </div>
        <div className="card p-5 md:p-6 space-y-5">
        {a?.error && <Alert>{a.error}</Alert>}
        <Field label="Titre" name="title" required minLength={5} maxLength={90} placeholder="Ex. Boubou en bazin brodé, taille M" error={e.title} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Catégorie">
            <Select value={cat} onChange={setCat} required placeholder="Choisir une catégorie" aria-label="Catégorie" options={cats.filter((x) => !x.is_shops).map((x) => ({ value: x.slug, label: x.name }))} />
          </Field>
          <Field label="Sous-Catégorie" error={e.subcategoryId}>
            <Select key={cat} name="subcategoryId" required disabled={!c} placeholder={c ? 'Choisir une sous-catégorie' : 'Choisissez d’abord une catégorie'} aria-label="Sous-catégorie" options={(c?.subs || []).map((x) => ({ value: String(x.id), label: x.name, hint: x.items.slice(0, 3).join(', ') }))} />
          </Field>
        </div>
        <Field label="Description"><textarea name="description" rows={4} maxLength={3000} className="input h-auto py-2" placeholder="Taille, couleur, état, ce qui est inclus…" /></Field>
        <div className="-mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={askAI} disabled={ai.state !== 'idle'} className="btn-ghost btn-sm text-turquoise border-turquoise/40">
            <Sparkles className={`size-3.5 ${ai.state !== 'idle' ? 'animate-spin' : ''}`} />{ai.state !== 'idle' ? 'SM-IA Rédige…' : 'Rédiger Avec SM-IA'}
          </button>
          <span className="text-xs text-muted">{aiData?.ai ? `Texte proposé, ${aiData.ai.credits} crédits utilisés. Relisez-le avant de publier.` : 'Environ 3 à 5 crédits, selon la longueur.'}</span>
          {aiData?.aiError && <span className="text-xs text-red-700 w-full">{aiData.aiError} <Link prefetch="intent" to="/ma-boutique/sm-ia/recharger" className="underline">Recharger</Link></span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Prix (FCFA)" name="priceFcfa" type="number" min={0} inputMode="numeric" required error={e.priceFcfa} />
          <Field label="Stock" name="stock" type="number" min={1} defaultValue={1} />
          <Field label="État"><Select name="condition" defaultValue="new" aria-label="État" options={Object.entries(CONDITION).map(([k, v]) => ({ value: k, label: v }))} /></Field>
        </div>
        <Checks label="Remise" name="delivery" opts={DELIVERY} def={['hand']} error={e.delivery} />
        <Checks label="Paiements Acceptés (Directement À Vous)" name="payMethods" opts={PAY} def={['wave', 'orange_money', 'cash']} error={e.payMethods} />
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary press" disabled={busy}>{busy ? 'Publication…' : 'Publier L’Annonce'}</button>
          <button name="draft" value="1" className="btn-ghost press" disabled={busy}>Enregistrer En Brouillon</button>
        </div>
        </div>
      </Form>
    </>
  );
}

function Checks({ label, name, opts, def, error }: any) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(opts).map(([k, v]: any) => (
          <label key={k} className="flex items-center gap-2 text-[13.5px] text-ink-2 cursor-pointer pr-3">
            <input type="checkbox" name={name} value={k} defaultChecked={def.includes(k)} className="size-4 accent-indigo rounded" />{v}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-700 mt-1">{[].concat(error)[0]}</p>}
    </fieldset>
  );
}
