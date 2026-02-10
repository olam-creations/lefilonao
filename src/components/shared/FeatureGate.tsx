'use client';

import { useState, type ReactNode } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { FEATURES, type FeatureKey } from '@/lib/features';
import ProBadge from './ProBadge';
import UpgradeModal from './UpgradeModal';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** Show grayed out content with overlay instead of hiding completely */
  mode?: 'overlay' | 'hide';
}

export default function FeatureGate({ feature, children, mode = 'overlay' }: FeatureGateProps) {
  const { can } = usePlan();
  const [showModal, setShowModal] = useState(false);

  if (can(feature)) {
    return <>{children}</>;
  }

  const featureDef = FEATURES[feature];

  if (mode === 'hide') {
    return null;
  }

  return (
    <>
      <div className="relative">
        <div className="opacity-40 pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl cursor-pointer group"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-shadow">
            <ProBadge />
            <span className="text-sm font-medium text-slate-700">
              {featureDef.label}
            </span>
          </div>
        </button>
      </div>

      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        featureLabel={featureDef.label}
      />
    </>
  );
}
