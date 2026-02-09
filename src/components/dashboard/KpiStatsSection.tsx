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
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
    >
      <KpiStatCard
        label="Pipeline"
        value={pipeline.total}
        sub={`${pipeline.go} GO, ${pipeline.maybe} Maybe, ${pipeline.pass} Pass`}
        icon={<Activity className="w-4 h-4" />}
        accent="indigo"
      >
        <PipelineBar {...pipeline} />
      </KpiStatCard>

      <KpiStatCard
        label="Deadlines proches"
        value={deadline.urgentCount}
        sub={deadline.urgentCount > 0 ? 'AO dans les 7 prochains jours' : 'Aucune urgence'}
        icon={<AlertTriangle className="w-4 h-4" />}
        accent={deadline.urgentCount > 0 ? 'red' : 'emerald'}
      />

      <KpiStatCard
        label="Profil entreprise"
        value={profile.completenessPercent}
        sub={profile.completenessPercent >= 100 ? 'Complet' : 'Completer votre profil'}
        icon={<UserCheck className="w-4 h-4" />}
        accent={profile.completenessPercent >= 80 ? 'emerald' : 'violet'}
      >
        <div className="flex items-center gap-3">
          <ProfileCompletenessRing percent={profile.completenessPercent} size={40} strokeWidth={3} />
          {profile.completenessPercent < 100 && (
            <Link
              href="/dashboard/profile"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Completer
            </Link>
          )}
        </div>
      </KpiStatCard>

      <KpiStatCard
        label="Taux de reponse"
        value={responseRate.percent}
        sub={`${responseRate.decided}/${responseRate.total} decisions prises`}
        icon={<CheckCircle className="w-4 h-4" />}
        accent="emerald"
      />
    </motion.div>
  );
}
