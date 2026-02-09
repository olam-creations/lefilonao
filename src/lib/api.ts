import { getToken, clearToken } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://meragel.vercel.app';

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // In dev mode, don't clear token or redirect — let the caller handle fallback to mock data
    const isDev = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!isDev) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  return res;
}

export const api = {
  subscribe: (data: Record<string, unknown>) =>
    fetch(`${API_URL}/api/excalibur/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  login: (email: string) =>
    fetch(`${API_URL}/api/excalibur/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),

  dashboard: () => authenticatedFetch('/api/excalibur/dashboard'),

  checkout: (data: Record<string, unknown>) =>
    authenticatedFetch('/api/excalibur/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
