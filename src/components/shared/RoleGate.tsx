'use client';

import { useUser } from '@/components/UserProvider';
import type { UserRole } from '@/lib/features';
import { ReactNode } from 'react';

interface RoleGateProps {
  children: ReactNode;
  minRole?: UserRole;
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
}

const ROLE_RANK: Record<UserRole, number> = {
  free: 0,
  pro: 1,
  admin: 2,
};

/**
 * Utility component to show/hide content based on user role.
 * 
 * Usage:
 * <RoleGate minRole="pro"> Only pros can see this </RoleGate>
 * <RoleGate allowedRoles={['admin']}> Only admins </RoleGate>
 */
export default function RoleGate({ 
  children, 
  minRole, 
  allowedRoles, 
  fallback = null 
}: RoleGateProps) {
  const { role, loading } = useUser();

  if (loading) return null;

  let allowed = false;

  if (allowedRoles) {
    allowed = allowedRoles.includes(role);
  } else if (minRole) {
    allowed = ROLE_RANK[role] >= ROLE_RANK[minRole];
  }

  if (!allowed) return <>{fallback}</>;

  return <>{children}</>;
}
