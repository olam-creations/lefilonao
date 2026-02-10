'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FeedbackWidget from '@/components/FeedbackWidget';

const DashboardShell = dynamic(
  () => import('@/components/shared/DashboardShell'),
  { ssr: false }
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell>
      <ErrorBoundary>{children}</ErrorBoundary>
      <FeedbackWidget />
    </DashboardShell>
  );
}
