import { Navigate, useLocation } from 'react-router';
import { useApp } from './store';
import type { ReactNode } from 'react';

export function RequireAuth({ children }: { children: ReactNode }) {
  const operatorId = useApp((s) => s.operatorId);
  const loc = useLocation();
  if (!operatorId) return <Navigate to="/" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
