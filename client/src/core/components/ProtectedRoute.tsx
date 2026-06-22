import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { message } from 'antd';
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

  const denied =
    !isAuthenticated ||
    (permission != null && !hasPermission(permission)) ||
    (permissions != null && permissions.length > 0 && (
      requireAll
        ? !permissions.every((p) => hasPermission(p))
        : !permissions.some((p) => hasPermission(p))
    ));

  useEffect(() => {
    if (denied) {
      message.warning('You do not have permission to access this page.');
    }
  }, [denied]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (denied) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
