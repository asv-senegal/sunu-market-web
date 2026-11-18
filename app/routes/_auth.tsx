// Cadre partagé des écrans de connexion et d'inscription
export function AuthFrame({ title, sub, step, children }: { title: string; sub?: string; step?: number; children: React.ReactNode }) {
  return (
    <div className="container-x py-8 md:py-14 grid md:grid-cols-2 gap-10 items-center max-w-5xl">
      <div className="hidden md:block relative rounded-3xl overflow-hidden aspect-[4/5]">
        <img src="/demo/tailor_sewing.jpg" alt="" className="absolute inset-0 size-full object-cover kenburns" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo/90 to-transparent" />
        <p className="absolute bottom-6 left-6 right-6 text-white font-display text-2xl font-semibold leading-snug">Des membres vérifiés, des échanges en confiance.</p>
      </div>
      <div className="card p-6 md:p-8 animate-fade-up">
        {step && (
          <div className="flex gap-1.5 mb-5" aria-label={`Étape ${step} sur 3`}>
            {[1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-orange' : 'bg-sable-dark'}`} />)}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold text-indigo">{title}</h1>
        {sub && <p className="text-sm text-muted mt-1 mb-6">{sub}</p>}
        {children}
      </div>
    </div>
  );
}
