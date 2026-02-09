import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

function hasErrorTrackingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('lefilonao_consent');
    if (!raw) return false;
    const consent = JSON.parse(raw);
    return consent.errorTracking === true;
  } catch {
    return false;
  }
}

function initSentry(): void {
  if (!dsn) return;
  if (!hasErrorTrackingConsent()) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
  });
}

initSentry();

if (typeof window !== 'undefined') {
  window.addEventListener('consent-updated', ((e: CustomEvent) => {
    if (e.detail?.errorTracking && !Sentry.getClient()) {
      initSentry();
    }
  }) as EventListener);
}
