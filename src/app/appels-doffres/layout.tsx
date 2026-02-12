'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import DashboardShell from '@/components/shared/DashboardShell';
import FeedbackWidget from '@/components/FeedbackWidget';
import { UserProvider } from '@/components/UserProvider';

export default function AppelsDoffresLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <DashboardShell>
        <ErrorBoundary>{children}</ErrorBoundary>
        <FeedbackWidget />
      </DashboardShell>
    </UserProvider>
  );
}
