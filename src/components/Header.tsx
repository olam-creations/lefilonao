'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, LogOut, Menu, X } from 'lucide-react';
import { logout } from '@/lib/auth';
import { useUser } from '@/components/UserProvider';
import Logo from '@/components/shared/Logo';

type Variant = 'public' | 'dashboard';
type ActivePage = 'dashboard' | 'intelligence' | 'opportunities' | 'alerts' | 'watchlist' | 'profile' | 'settings' | 'ao';

interface HeaderProps {
  variant?: Variant;
  activePage?: ActivePage;
  backHref?: string;
  rightSlot?: ReactNode;
}

const PUBLIC_NAV = [
  { href: '/#features', label: 'Fonctionnalités' },
  { href: '/pricing', label: 'Prix' },
];

const DASHBOARD_NAV: { href: string; label: string; page: ActivePage }[] = [
  { href: '/dashboard', label: 'Dashboard', page: 'dashboard' },
  { href: '/appels-doffres', label: 'Appels d\'offres', page: 'opportunities' },
  { href: '/dashboard/alerts', label: 'Alertes', page: 'alerts' },
  { href: '/dashboard/watchlist', label: 'Watchlist', page: 'watchlist' },
  { href: '/dashboard/market', label: 'Marché', page: 'intelligence' },
  { href: '/dashboard/profile', label: 'Profil', page: 'profile' },
  { href: '/dashboard/settings', label: 'Paramètres', page: 'settings' },
];

export default function Header({ variant = 'public', activePage, backHref, rightSlot }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { authenticated } = useUser();

  useEffect(() => {
    if (variant !== 'public') return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Focus trap: trap Tab inside mobile overlay, auto-focus close button
  useEffect(() => {
    if (!mobileOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const closeBtn = overlay.querySelector<HTMLElement>('[aria-label="Fermer le menu"]');
    closeBtn?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = overlay.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [mobileOpen]);

  const handleLogout = useCallback(() => {
    logout();
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const maxW = variant === 'dashboard' ? 'max-w-7xl' : 'max-w-6xl';

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          variant === 'public' && scrolled ? 'glass-scrolled' : 'glass'
        }`}
      >
        <div className={`${maxW} mx-auto px-6 h-16 flex items-center justify-between`}>
          {/* Left: back arrow + logo */}
          <div className="flex items-center gap-4">
            {backHref && (
              <Link href={backHref} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </Link>
            )}
            <Link href="/">
              <Logo size="sm" />
            </Link>
          </div>

          {/* Center: desktop nav */}
          {variant === 'public' && (
            <nav className="hidden md:flex items-center gap-8">
              {PUBLIC_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {variant === 'dashboard' && (
            <nav className="hidden md:flex items-center gap-6">
              {DASHBOARD_NAV.map((link) => {
                const isActive = activePage === link.page;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm transition-colors ${
                      isActive
                        ? 'text-indigo-600 font-medium'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-3">
            {variant === 'public' && !authenticated && (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  Connexion
                </Link>
                <Link href="/subscribe" className="btn-primary text-sm py-2 px-4">
                  S&apos;inscrire <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {variant === 'public' && authenticated && (
              <Link href="/dashboard" className="hidden md:inline-flex btn-primary text-sm py-2 px-4">
                Mon dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {variant === 'dashboard' && rightSlot}

            {variant === 'dashboard' && (
              <button
                onClick={handleLogout}
                className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 transition-colors group"
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              ref={triggerRef}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={overlayRef}
            className="fixed inset-0 z-50 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <Link href="/" onClick={closeMobile}><Logo size="sm" /></Link>
              <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Fermer le menu">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <nav className="p-6 space-y-1">
              {variant === 'public' && (
                <>
                  {PUBLIC_NAV.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMobile}
                      className="block py-3 px-4 text-slate-700 hover:bg-slate-50 rounded-lg text-lg"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="pt-4">
                    {authenticated ? (
                      <Link href="/dashboard" onClick={closeMobile} className="btn-primary w-full justify-center py-3">
                        Mon dashboard <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <>
                        <Link href="/login" onClick={closeMobile} className="block py-3 px-4 text-slate-700 hover:bg-slate-50 rounded-lg text-lg mb-1">
                          Connexion
                        </Link>
                        <Link href="/subscribe" onClick={closeMobile} className="btn-primary w-full justify-center py-3">
                          S&apos;inscrire gratuitement <ArrowRight className="w-4 h-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}

              {variant === 'dashboard' && (
                <>
                  {DASHBOARD_NAV.map((link) => {
                    const isActive = activePage === link.page;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMobile}
                        className={`block py-3 px-4 rounded-lg text-lg ${
                          isActive
                            ? 'text-indigo-600 font-medium bg-indigo-50'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <div className="pt-4 border-t border-slate-100 mt-4">
                    <button
                      onClick={() => { closeMobile(); handleLogout(); }}
                      className="w-full text-left py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg text-lg"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
