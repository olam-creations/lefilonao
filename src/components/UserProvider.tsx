'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { checkAuth, clearAuthCache } from '@/lib/auth';
import type { Plan } from '@/lib/features';

interface UserContextValue {
  email: string;
  displayName: string;
  plan: Plan;
  loading: boolean;
  authenticated: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  email: '',
  displayName: '',
  plan: 'free',
  loading: true,
  authenticated: false,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<UserContextValue, 'refresh'>>({
    email: '',
    displayName: '',
    plan: 'free',
    loading: true,
    authenticated: false,
  });

  const refresh = async () => {
    clearAuthCache();
    const session = await checkAuth();
    setState({
      email: session.email,
      displayName: session.displayName,
      plan: (session.plan === 'pro' ? 'pro' : 'free') as Plan,
      loading: false,
      authenticated: session.authenticated,
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <UserContext.Provider value={{ ...state, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
