'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import TopBar from '@/components/dashboard/TopBar';
import { logout } from '@/lib/auth';
import { stagger, fadeUp } from '@/lib/motion-variants';
import { useUserSettings } from '@/hooks/useUserSettings';
import AccountCard from '@/components/settings/AccountCard';
import PreferencesCard from '@/components/settings/PreferencesCard';
import PlatformCredentialsCard from '@/components/settings/PlatformCredentialsCard';
import SubscriptionCard from '@/components/settings/SubscriptionCard';
import NotificationsCard from '@/components/settings/NotificationsCard';
import DangerZoneCard from '@/components/settings/DangerZoneCard';

export default function SettingsPage() {
  const { settings, email, loading, saving, saved, error, updateSettings, saveSettings, refreshSettings } =
    useUserSettings();

  const handleLogout = useCallback(() => {
    logout();
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Paramètres" description="Gérez votre compte et vos préférences" />
        <div className="max-w-4xl mx-auto py-10">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="skeleton h-6 w-48 mb-4" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Paramètres"
        description="Gérez votre compte et vos préférences"
        icon={<Settings className="w-6 h-6 text-indigo-600" />}
      />

      <div className="max-w-4xl mx-auto py-10">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
          {error && (
            <motion.div
              variants={fadeUp}
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}

          <AccountCard
            email={email}
            displayName={settings.display_name}
            createdAt={settings.created_at}
            onDisplayNameChange={(name) => updateSettings({ display_name: name })}
            onSave={saveSettings}
            saving={saving}
            saved={saved}
            onLogout={handleLogout}
          />

          <PreferencesCard
            settings={settings}
            onUpdate={updateSettings}
            onSave={saveSettings}
            saving={saving}
            saved={saved}
          />

          <NotificationsCard
            notifyFrequency={settings.notify_frequency}
            notifyEmail={settings.notify_email}
            onUpdate={updateSettings}
            onSave={saveSettings}
            saving={saving}
            saved={saved}
          />

          <PlatformCredentialsCard email={email} />

          <SubscriptionCard
            plan={settings.plan}
            createdAt={settings.created_at}
            stripeStatus={settings.stripe_status}
            currentPeriodEnd={settings.current_period_end}
            cancelAtPeriodEnd={settings.cancel_at_period_end}
            hasStripeCustomer={!!settings.stripe_customer_id}
            onStatusChange={refreshSettings}
          />

          <DangerZoneCard email={email} />
        </motion.div>
      </div>
    </div>
  );
}
