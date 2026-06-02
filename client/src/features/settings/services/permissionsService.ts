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
  async getGroups(): Promise<PermissionGroups> {
    const { data } = await apiClient.get(API_ENDPOINTS.permissions.groups);
    return data.data;
  },

  async getRolePermissions(): Promise<RolePermissionsResponse> {
    const { data } = await apiClient.get(API_ENDPOINTS.permissions.roles);
    return data.data;
  },

  async updateRolePermissions(role: string, permissions: string[]): Promise<{ message: string }> {
    const { data } = await apiClient.put(API_ENDPOINTS.permissions.role(role), { permissions });
    return data;
  },

  async resetRolePermissions(role: string): Promise<{ message: string }> {
    const { data } = await apiClient.post(API_ENDPOINTS.permissions.resetRole(role));
    return data;
  },
};
