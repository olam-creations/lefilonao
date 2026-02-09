import { useState, useEffect } from 'react';
import { getCompanyProfile } from '@/lib/profile-storage';
import { computeProfileKpi, type ProfileKpi } from '@/lib/dashboard-kpi';

export function useCompanyCompleteness(): ProfileKpi {
  const [kpi, setKpi] = useState<ProfileKpi>({
    completenessPercent: 0,
    filledFields: 0,
    totalFields: 1,
  });

  useEffect(() => {
    const profile = getCompanyProfile();
    setKpi(computeProfileKpi(profile));
  }, []);

  return kpi;
}
