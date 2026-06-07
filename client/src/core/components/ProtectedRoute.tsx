import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePermission } from '../hooks/usePermission';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: string;
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = '/dashboard',
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { hasPermission } = usePermission();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={fallback} replace />;
  }

  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? permissions.every((p) => hasPermission(p))
      : permissions.some((p) => hasPermission(p));

    if (!hasAccess) {
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}
