'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import CommandPalette from '@/components/dashboard/CommandPalette';
import PageTransition from '@/components/dashboard/PageTransition';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import Logo from '@/components/shared/Logo';

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { isCollapsed, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const paddingLeft = isMobile ? 0 : (isCollapsed ? 56 : 220);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <CommandPalette />

      <motion.main
        initial={false}
        animate={{ paddingLeft }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 w-full min-h-screen relative overflow-x-hidden"
      >
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200 px-4 h-14 flex items-center gap-3">
          <button
            onClick={openMobile}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <Logo collapsed={false} size="xs" />
        </div>

        <div className="p-4 md:p-6 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={pathname}>
                {children}
              </PageTransition>
            </AnimatePresence>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
