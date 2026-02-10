export const api = {
  register: (data: Record<string, unknown>) =>
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    }),

  enrichSiret: (siret: string) =>
    fetch('/api/onboarding/enrich-siret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siret }),
    }),

  login: (email: string, password: string) =>
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    }),

  checkout: () =>
    fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }),

  portal: () =>
    fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }),

  subscription: () =>
    fetch('/api/stripe/subscription', { credentials: 'include' }),

  cancel: () =>
    fetch('/api/stripe/cancel', {
      method: 'POST',
      credentials: 'include',
    }),

  resume: () =>
    fetch('/api/stripe/resume', {
      method: 'POST',
      credentials: 'include',
    }),
};
