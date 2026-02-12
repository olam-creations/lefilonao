'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Plan, UserRole } from '@/lib/features';
import { useRouter } from 'next/navigation';
import { getUser, signOut as serverSignOut } from '@/app/auth/actions';

interface UserContextValue {
  email: string;
  displayName: string;
  plan: Plan;
  role: UserRole;
  loading: boolean;
  authenticated: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  email: '',
  displayName: '',
  plan: 'free',
  role: 'free',
  loading: true,
  authenticated: false,
  refresh: async () => {},
  signOut: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<UserContextValue, 'refresh' | 'signOut'>>({
    email: '',
    displayName: '',
    plan: 'free',
    role: 'free',
    loading: true,
    authenticated: false,
  });
  const router = useRouter();

  const refresh = async () => {
    try {
      const user = await getUser();

      if (!user) {
        setState({
          email: '',
          displayName: '',
          plan: 'free',
          role: 'free',
          loading: false,
          authenticated: false,
        });
        return;
      }

      setState({
        email: user.email || '',
        displayName: user.displayName,
        plan: (['admin', 'pro', 'free'].includes(user.plan) ? user.plan : 'free') as Plan,
        role: user.role as UserRole,
        loading: false,
        authenticated: true,
      });
    } catch (e) {
      console.error('Error refreshing user:', e);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    await serverSignOut();
    setState({
      email: '',
      displayName: '',
      plan: 'free',
      role: 'free',
      loading: false,
      authenticated: false,
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <UserContext.Provider value={{ ...state, refresh, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
