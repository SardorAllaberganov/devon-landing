import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  children: ReactElement;
}

export function RequireAuth({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isExpired = useAuthStore((s) => s.isExpired);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  if (!isAuthenticated || isExpired()) {
    if (isExpired()) logout();
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  return children;
}
