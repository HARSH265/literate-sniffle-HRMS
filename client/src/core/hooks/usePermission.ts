import { useAuthStore } from '../stores/authStore';

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (_permission: string) => {
    if (!user) return false;
    return true;
  };

  const isAllowed = (permission: string) => {
    return hasPermission(permission);
  };

  return { hasRole, hasPermission, isAllowed };
}

export default usePermission;