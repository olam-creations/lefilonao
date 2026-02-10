'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import CommandPalette from '@/components/dashboard/CommandPalette';
import PageTransition from '@/components/dashboard/PageTransition';

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkSidebar = () => {
      const saved = localStorage.getItem('lefilonao_sidebar_collapsed');
      setIsSidebarCollapsed(saved === 'true');
    };

    checkSidebar();
    window.addEventListener('storage', checkSidebar);
    const interval = setInterval(checkSidebar, 500);

    return () => {
      window.removeEventListener('storage', checkSidebar);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <CommandPalette />

      <motion.main
        initial={false}
        animate={{
          paddingLeft: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : (isSidebarCollapsed ? 80 : 280)
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="flex-1 w-full min-h-screen relative overflow-x-hidden"
      >
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
