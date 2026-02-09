import Link from 'next/link';

const LEGAL_PAGES = [
  { href: '/mentions-legales', label: 'Mentions légales', short: 'Mentions' },
  { href: '/politique-confidentialite', label: 'Confidentialité', short: 'Confidentialité' },
  { href: '/cgu', label: 'CGU', short: 'CGU' },
  { href: '/cgv', label: 'CGV', short: 'CGV' },
] as const;

export default function LegalShell({
  title,
  updatedAt,
  currentPath,
  children,
}: {
  title: string;
  updatedAt: string;
  currentPath: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-indigo-600 transition-colors mb-5"
          >
            <span>&larr;</span> Accueil
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-400 mt-2">Dernière mise à jour : {updatedAt}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 md:py-10 flex flex-col md:flex-row gap-8 md:gap-10">
        {/* Sidebar */}
        <aside className="md:w-52 flex-shrink-0">
          {/* Nav links — horizontal scroll on mobile, vertical on desktop */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-1 md:mx-0">
            {LEGAL_PAGES.map((page) => {
              const active = currentPath === page.href;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="md:hidden">{page.short}</span>
                  <span className="hidden md:inline">{page.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Solo project callout */}
          <div className="hidden md:block mt-6 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-700 mb-1">Projet personnel</p>
            <p className="text-[11px] leading-relaxed text-indigo-600/70">
              Le Filon AO est conçu, développé et maintenu par une seule personne. Pas de startup, pas de levée de fonds
              — juste un produit utile, construit avec soin.
            </p>
          </div>
        </aside>

        {/* Content */}
        <article className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-10">
          <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:tracking-tight prose-h2:text-lg prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4 prose-h2:pt-6 prose-h2:border-t prose-h2:border-slate-100 [&>h2:first-child]:mt-0 [&>h2:first-child]:pt-0 [&>h2:first-child]:border-t-0 prose-h3:text-base prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-li:text-slate-600 prose-strong:text-slate-800 prose-table:text-sm">
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}
