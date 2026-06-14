import apiClient from '../../../core/api/apiClient';
import { API_ENDPOINTS } from '../../../core/constants/api.endpoints';
import { PaginatedResponse } from '@/types/shared';

interface AuditLogQuery {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  userId?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

interface AuditLog {
  _id: string;
  action: string;
  actionLabel: string;
  module: string;
  moduleLabel: string;
  userId: { _id: string; name: string; email: string };
  targetId?: string;
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
  createdAt: string;
}

interface OptionItem {
  label: string;
  value: string;
}

export const auditService = {
  list: async (query: AuditLogQuery = {}): Promise<PaginatedResponse<AuditLog[]>> => {
    const params = new URLSearchParams();
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));
    if (query.module) params.append('module', query.module);
    if (query.action) params.append('action', query.action);
    if (query.userId) params.append('userId', query.userId);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);

    const response = await apiClient.get<PaginatedResponse<AuditLog[]>>(`${API_ENDPOINTS.auditLogs.list}?${params.toString()}`);
    return response.data;
  },

  getModules: async (): Promise<OptionItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: OptionItem[] }>(API_ENDPOINTS.auditLogs.modules);
    return response.data.data;
  },

  getActions: async (): Promise<OptionItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: OptionItem[] }>(API_ENDPOINTS.auditLogs.actions);
    return response.data.data;
  },

  exportLogs: async (query: AuditLogQuery = {}): Promise<{ success: boolean; data: AuditLog[] }> => {
    const params = new URLSearchParams();
    if (query.module) params.append('module', query.module);
    if (query.action) params.append('action', query.action);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);

    const response = await apiClient.get(`${API_ENDPOINTS.auditLogs.export}?${params.toString()}`);
    return response.data;
  },

  getStats: async (): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get(API_ENDPOINTS.auditLogs.stats);
    return response.data;
  },

  getRetentionInfo: async (): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.get(API_ENDPOINTS.auditLogs.retention);
    return response.data;
  },

  cleanupLogs: async (days: number): Promise<{ success: boolean; data: { deletedCount: number } }> => {
    const response = await apiClient.post(API_ENDPOINTS.auditLogs.cleanup, { days });
    return response.data;
  },
};