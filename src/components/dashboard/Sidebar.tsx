'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bell,
  Bookmark,
  BarChart3,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Target,
  Radar,
  X
} from 'lucide-react';
import { logout } from '@/lib/auth';
import Logo from '@/components/shared/Logo';
import { usePlan } from '@/hooks/usePlan';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, id: 'dashboard' },
  { href: '/appels-doffres', label: 'Appels d\'offres', icon: Target, id: 'opportunities' },
  { href: '/dashboard/alerts', label: 'Alertes', icon: Bell, id: 'alerts' },
  { href: '/dashboard/watchlist', label: 'Watchlist', icon: Bookmark, id: 'watchlist' },
  { href: '/dashboard/market', label: 'Intel Marché', icon: BarChart3, id: 'intelligence' },
  { href: '/dashboard/veille', label: 'Veille', icon: Radar, id: 'veille' },
];

const SECONDARY_NAV = [
  { href: '/dashboard/profile', label: 'Profil', icon: User, id: 'profile' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: Settings, id: 'settings' },
];

const W_EXPANDED = 220;
const W_COLLAPSED = 56;

function NavLink({ item, isCollapsed, onNavigate }: {
  item: typeof NAV_ITEMS[number];
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 group relative ${
        isActive
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[13px] font-medium whitespace-nowrap truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 w-[3px] h-5 bg-indigo-600 rounded-r-full"
        />
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          {item.label}
        </div>
      )}
    </Link>
  );
}

function SidebarContent({ isCollapsed, onNavigate }: { isCollapsed: boolean; onNavigate?: () => void }) {
  const { isPro } = usePlan();
  const { toggleCollapsed } = useSidebar();

  return (
    <>
      {/* Logo + Plan */}
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} border-b border-slate-100`}>
        <Link href="/" className="flex items-center gap-1.5" onClick={onNavigate}>
          <Logo collapsed={isCollapsed} size="xs" />
        </Link>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`ml-auto inline-flex items-center px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded ${
                isPro
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {isPro ? 'Pro' : 'Free'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} onNavigate={onNavigate} />
        ))}

        <div className="!mt-4 !mb-1 border-t border-slate-100 pt-3" />
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} isCollapsed={isCollapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-slate-100 space-y-1">
        <button
          onClick={() => logout()}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group relative"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-red-500" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[13px] font-medium whitespace-nowrap"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-red-600 text-white text-[11px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              Déconnexion
            </div>
          )}
        </button>

        {!onNavigate && (
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center w-full h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-150"
            aria-label={isCollapsed ? "Agrandir" : "Réduire"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
    </>
  );
}

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Close on Escape
  useEffect(() => {
    if (!isMobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMobileOpen, closeMobile]);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobileOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? W_COLLAPSED : W_EXPANDED }}
        className="hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-50 flex-col shadow-sm"
      >
        <SidebarContent isCollapsed={isCollapsed} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobileOpen && isMobile && (
          <motion.div
            className="fixed inset-0 z-50 flex md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
              onClick={closeMobile}
            />

            {/* Panel */}
            <motion.aside
              className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Close button */}
              <button
                onClick={closeMobile}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors z-10"
                aria-label="Fermer le menu"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <SidebarContent isCollapsed={false} onNavigate={closeMobile} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
