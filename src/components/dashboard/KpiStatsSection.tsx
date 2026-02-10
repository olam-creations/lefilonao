'use client';

import { motion } from 'framer-motion';
import { Activity, AlertTriangle, UserCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { stagger } from '@/lib/motion-variants';
import type { PipelineKpi, DeadlineKpi, ProfileKpi, ResponseRateKpi } from '@/lib/dashboard-kpi';
import KpiStatCard from './KpiStatCard';
import ProfileCompletenessRing from './ProfileCompletenessRing';

interface KpiStatsSectionProps {
  pipeline: PipelineKpi;
  deadline: DeadlineKpi;
  profile: ProfileKpi;
  responseRate: ResponseRateKpi;
}

function PipelineBar({ go, maybe, pass, total }: PipelineKpi) {
  if (total === 0) return null;
  const goPct = (go / total) * 100;
  const maybePct = (maybe / total) * 100;
  const passPct = (pass / total) * 100;

  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100" title={`GO: ${go} | Maybe: ${maybe} | Pass: ${pass}`}>
      {goPct > 0 && (
        <div className="bg-emerald-500 transition-all duration-400" style={{ width: `${goPct}%` }} />
      )}
      {maybePct > 0 && (
        <div className="bg-amber-400 transition-all duration-400" style={{ width: `${maybePct}%` }} />
      )}
      {passPct > 0 && (
        <div className="bg-slate-300 transition-all duration-400" style={{ width: `${passPct}%` }} />
      )}
    </div>
  );
}

export default function KpiStatsSection({ pipeline, deadline, profile, responseRate }: KpiStatsSectionProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full"
    >
      {/* Principal: Pipeline (Large on desktop) */}
      <div className="sm:col-span-2 lg:row-span-2">
        <KpiStatCard
          label="Pipeline global"
          value={pipeline.total}
          sub={`${pipeline.go} GO, ${pipeline.maybe} Maybe`}
          icon={<Activity className="w-5 h-5 text-indigo-500" />}
          accent="indigo"
          className="h-full"
        >
          <div className="mt-6 space-y-4">
            <PipelineBar {...pipeline} />
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> GO</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> MAYBE</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300" /> PASS</span>
            </div>
          </div>
        </KpiStatCard>
      </div>

      {/* Deadlines (Small) */}
      <div className="md:col-span-2">
        <KpiStatCard
          label="Urgent"
          value={deadline.urgentCount}
          sub={deadline.urgentCount > 0 ? 'Deadlines < 7 jours' : 'Tout est sous contrôle'}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent={deadline.urgentCount > 0 ? 'red' : 'emerald'}
          className="h-full"
        />
      </div>

      {/* Profil (Square) */}
      <div className="md:col-span-1">
        <KpiStatCard
          label="Complétude"
          value={`${profile.completenessPercent}%`}
          sub="Profil entreprise"
          icon={<UserCheck className="w-5 h-5" />}
          accent={profile.completenessPercent >= 80 ? 'emerald' : 'violet'}
          className="h-full"
        >
          <div className="mt-4 flex flex-col items-center">
             <ProfileCompletenessRing percent={profile.completenessPercent} size={54} strokeWidth={4} />
          </div>
        </KpiStatCard>
      </div>

      {/* Taux (Square) */}
      <div className="md:col-span-1">
        <KpiStatCard
          label="Engagement"
          value={`${responseRate.percent}%`}
          sub="Taux de réponse"
          icon={<CheckCircle className="w-5 h-5" />}
          accent="emerald"
          className="h-full"
        />
      </div>
    </motion.div>
  );
}
