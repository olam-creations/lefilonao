export const api = {
  register: (data: Record<string, unknown>) =>
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
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
};
