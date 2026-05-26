import { useAuthStore } from '../stores/authStore';
import { ROLE_PERMISSIONS } from '../constants/permissions';

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    const userPermissions = ROLE_PERMISSIONS[user.role];
    if (!userPermissions) return false;
    return userPermissions.includes(permission);
  };

  const isAllowed = (permission: string) => {
    return hasPermission(permission);
  };

  return { hasRole, hasPermission, isAllowed };
}

export default usePermission;