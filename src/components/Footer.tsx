'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      className="py-16 px-6 border-t border-transparent"
      style={{ borderImage: 'linear-gradient(to right, transparent, #c7d2fe, transparent) 1' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-lg font-semibold text-slate-900">
              Le Filon <span className="gradient-text">AO</span>
            </Link>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Veille march&eacute;s publics intelligente par IA.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Tous les syst&egrave;mes op&eacute;rationnels
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-4">Produit</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/#features" className="text-slate-500 hover:text-slate-900 transition-colors">Fonctionnalit&eacute;s</Link></li>
              <li><Link href="/pricing" className="text-slate-500 hover:text-slate-900 transition-colors">Prix</Link></li>
              <li><Link href="/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-4">Ressources</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/#how" className="text-slate-500 hover:text-slate-900 transition-colors">Comment &ccedil;a marche</Link></li>
              <li><Link href="/subscribe" className="text-slate-500 hover:text-slate-900 transition-colors">S&apos;inscrire</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-4">L&eacute;gal</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/mentions-legales" className="text-slate-500 hover:text-slate-900 transition-colors">Mentions l&eacute;gales</Link></li>
              <li><Link href="/politique-confidentialite" className="text-slate-500 hover:text-slate-900 transition-colors">Confidentialit&eacute;</Link></li>
              <li><Link href="/cgu" className="text-slate-500 hover:text-slate-900 transition-colors">CGU</Link></li>
              <li><Link href="/cgv" className="text-slate-500 hover:text-slate-900 transition-colors">CGV</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-4">Contact</p>
            <ul className="space-y-3 text-sm">
              <li><a href="mailto:contact@lefilonao.com" className="text-slate-500 hover:text-slate-900 transition-colors">contact@lefilonao.com</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">&copy; 2026 Le Filon AO</p>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <button
              type="button"
              className="hover:text-slate-500 transition-colors cursor-pointer"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-cookie-banner'));
                }
              }}
            >
              G&eacute;rer les cookies
            </button>
            <span>Fait avec soin &agrave; Paris</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
