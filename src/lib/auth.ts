const TOKEN_KEY = 'lefilonao_token';
const ONBOARDING_KEY = 'lefilonao_onboarding';
const REDIRECT_KEY = 'lefilonao_redirect';

// ─── Token ───

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  // Mirror to cookie so middleware can check auth
  const payload = decodePayload(token);
  const maxAge = payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : 60 * 60 * 24 * 7;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `lefilonao_session=1; path=/; max-age=${maxAge}; samesite=lax${isSecure ? '; secure' : ''}`;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = 'lefilonao_session=; path=/; max-age=0';
}

// ─── JWT Decode (no crypto verification) ───

interface TokenPayload {
  sub?: string;
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

function decodePayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1])) as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenPayload(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;
  return decodePayload(token);
}

export function isTokenExpired(): boolean {
  const payload = getTokenPayload();
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired()) {
    clearToken();
    return false;
  }
  return true;
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
