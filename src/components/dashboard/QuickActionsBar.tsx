'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, FileWarning, UserCheck, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion-variants';
import { daysUntil } from '@/lib/ao-utils';
import type { CompanyProfile } from '@/lib/dev';
import type { RFP } from '@/hooks/useDashboardFilters';

interface QuickActionsBarProps {
  rfps: RFP[];
  profile: CompanyProfile;
  profileCompleteness: number;
}

interface Alert {
  key: string;
  icon: React.ReactNode;
  text: string;
  href?: string;
  severity: 'red' | 'amber';
}

export default function QuickActionsBar({ rfps, profile, profileCompleteness }: QuickActionsBarProps) {
  const alerts = useMemo((): Alert[] => {
    const result: Alert[] = [];
    const plural = (n: number) => n > 1 ? 's' : '';

    const expiredCount = profile.documents.filter((d) => d.status === 'expired').length;
    if (expiredCount > 0) {
      result.push({
        key: 'expired-docs',
        icon: <FileWarning className="w-4 h-4" />,
        text: `${expiredCount} document${plural(expiredCount)} expire${plural(expiredCount)}`,
        href: '/dashboard/profile',
        severity: 'red',
      });
    }

    const expiringCount = profile.documents.filter((d) => d.status === 'expiring').length;
    if (expiringCount > 0) {
      result.push({
        key: 'expiring-docs',
        icon: <AlertTriangle className="w-4 h-4" />,
        text: `${expiringCount} document${plural(expiringCount)} bientot expire${plural(expiringCount)}`,
        href: '/dashboard/profile',
        severity: 'amber',
      });
    }

    const urgentCount = rfps.filter((r) => {
      const days = daysUntil(r.deadline);
      return days !== null && days >= 0 && days <= 2;
    }).length;
    if (urgentCount > 0) {
      result.push({
        key: 'urgent-deadlines',
        icon: <Clock className="w-4 h-4" />,
        text: `${urgentCount} AO avec deadline < 48h`,
        severity: 'red',
      });
    }

    if (profileCompleteness < 100) {
      result.push({
        key: 'profile-incomplete',
        icon: <UserCheck className="w-4 h-4" />,
        text: `Profil a ${profileCompleteness}% — completez-le`,
        href: '/dashboard/profile',
        severity: 'amber',
      });
    }

    return result;
  }, [rfps, profile, profileCompleteness]);

  if (alerts.length === 0) return null;

  const severityStyles = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="flex flex-wrap items-center gap-3 mb-6"
    >
      {/* New AO button */}
      <Link
        href="/appels-doffres"
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-700 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Nouvel AO
      </Link>

      {/* Alert pills */}
      {alerts.map((alert) => {
        const cls = severityStyles[alert.severity];
        const content = (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border ${cls}`}>
            {alert.icon}
            {alert.text}
          </span>
        );

        return alert.href ? (
          <Link key={alert.key} href={alert.href} className="hover:opacity-80 transition-opacity">
            {content}
          </Link>
        ) : (
          <span key={alert.key}>{content}</span>
        );
      })}
    </motion.div>
  );
}
