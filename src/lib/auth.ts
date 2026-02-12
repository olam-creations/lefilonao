import { getUser, signOut as serverSignOut } from '@/app/auth/actions';

const ONBOARDING_KEY = 'lefilonao_onboarding';
const REDIRECT_KEY = 'lefilonao_redirect';

// ─── Session (bridged to Server Actions) ───

interface SessionData {
  authenticated: boolean;
  email: string;
  displayName: string;
  plan: string;
}

let sessionCache: SessionData | null = null;

/** Fetch session from server. Cached until clearAuthCache(). */
export async function checkAuth(): Promise<SessionData> {
  if (sessionCache) return sessionCache;

  try {
    const user = await getUser();
    if (user) {
      sessionCache = {
        authenticated: true,
        email: user.email || '',
        displayName: user.displayName || '',
        plan: user.plan || 'free',
      };
    } else {
      sessionCache = { authenticated: false, email: '', displayName: '', plan: 'free' };
    }
  } catch {
    sessionCache = { authenticated: false, email: '', displayName: '', plan: 'free' };
  }

  return sessionCache;
}

/** Clear the in-memory session cache (call after login/logout). */
export function clearAuthCache(): void {
  sessionCache = null;
}

/** Logout: uses Server Action, clear cache, redirect. */
export async function logout(): Promise<void> {
  try {
    await serverSignOut();
  } catch {
    // Best-effort
  }
  clearAuthCache();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ONBOARDING_KEY);
    window.location.href = '/login';
  }
}

// ─── Onboarding ───

export interface OnboardingState {
  dismissed: boolean;
  steps: {
    profile: boolean;
    explore: boolean;
    market: boolean;
    export: boolean;
    alerts: boolean;
  };
}

const DEFAULT_ONBOARDING: OnboardingState = {
  dismissed: false,
  steps: {
    profile: true,
    explore: false,
    market: false,
    export: false,
    alerts: false,
  },
};

export function getOnboarding(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULT_ONBOARDING;
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return DEFAULT_ONBOARDING;
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return DEFAULT_ONBOARDING;
  }
}

export function initOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(DEFAULT_ONBOARDING));
}

export function markOnboardingStep(step: keyof OnboardingState['steps']): void {
  const state = getOnboarding();
  const updated: OnboardingState = {
    ...state,
    steps: { ...state.steps, [step]: true },
  };
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
}

export function dismissOnboarding(): void {
  const state = getOnboarding();
  const updated: OnboardingState = { ...state, dismissed: true };
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
}

// ─── Redirect After Login ───

export function setRedirectAfterLogin(path: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(REDIRECT_KEY, path);
}

export function getRedirectAfterLogin(): string | null {
  if (typeof window === 'undefined') return null;
  const path = sessionStorage.getItem(REDIRECT_KEY);
  if (path) sessionStorage.removeItem(REDIRECT_KEY);
  return path;
}
