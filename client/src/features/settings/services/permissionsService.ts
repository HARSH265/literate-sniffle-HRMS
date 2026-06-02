import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';

export interface PermissionGroups {
  [groupName: string]: string[];
}

export interface RolePermissions {
  permissions: string[];
  isCustom: boolean;
}

export interface RolePermissionsResponse {
  [role: string]: RolePermissions;
}

export const permissionsService = {
  async getGroups(): Promise<{ data: PermissionGroups }> {
    const res = await apiClient.get(API_ENDPOINTS.permissions.groups);
    return res.data;
  },

  async getRolePermissions(): Promise<{ data: RolePermissionsResponse }> {
    const res = await apiClient.get(API_ENDPOINTS.permissions.roles);
    return res.data;
  },

  async updateRolePermissions(role: string, permissions: string[]): Promise<{ message: string }> {
    const res = await apiClient.put(API_ENDPOINTS.permissions.role(role), { permissions });
    return res.data;
  },

  async resetRolePermissions(role: string): Promise<{ message: string }> {
    const res = await apiClient.post(API_ENDPOINTS.permissions.resetRole(role));
    return res.data;
  },
};
