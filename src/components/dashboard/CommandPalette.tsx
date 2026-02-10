'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Target, Bell, Bookmark, BarChart3, User, Settings, X, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';

const QUICK_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Navigation' },
  { href: '/dashboard/opportunities', label: 'Opportunités', icon: Target, category: 'Navigation' },
  { href: '/dashboard/alerts', label: 'Alertes', icon: Bell, category: 'Navigation' },
  { href: '/dashboard/watchlist', label: 'Watchlist', icon: Bookmark, category: 'Navigation' },
  { href: '/dashboard/market', label: 'Intelligence Marché', icon: BarChart3, category: 'Navigation' },
  { href: '/dashboard/profile', label: 'Profil Entreprise', icon: User, category: 'Compte' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, category: 'Compte' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredLinks = QUICK_LINKS.filter((link) =>
    link.label.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />

          {/* Palette */}
          <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Rechercher une page ou une action... (Ctrl+K)"
                  className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-base"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                  Esc
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredLinks.length > 0 ? (
                  <div className="space-y-1">
                    {filteredLinks.map((link, idx) => (
                      <button
                        key={link.href}
                        onClick={() => navigate(link.href)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <link.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-900">{link.label}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">{link.category}</div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase">
                            Entrée <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm">Aucun résultat pour &quot;{query}&quot;</p>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white shadow-sm">↑↓</kbd> Naviguer
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white shadow-sm">↵</kbd> Sélectionner
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <Command className="w-3 h-3" /> Le Filon
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
