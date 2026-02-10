'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import DashboardShell from '@/components/shared/DashboardShell';
import FeedbackWidget from '@/components/FeedbackWidget';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      <ErrorBoundary>{children}</ErrorBoundary>
      <FeedbackWidget />
    </DashboardShell>
  );
}
