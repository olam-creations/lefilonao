'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import DashboardShell from '@/components/shared/DashboardShell';
import FeedbackWidget from '@/components/FeedbackWidget';
import { UserProvider } from '@/components/UserProvider';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <SidebarProvider>
        <DashboardShell>
          <ErrorBoundary>{children}</ErrorBoundary>
          <FeedbackWidget />
        </DashboardShell>
      </SidebarProvider>
    </UserProvider>
  );
}
