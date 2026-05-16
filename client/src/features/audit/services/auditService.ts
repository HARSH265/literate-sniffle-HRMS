import apiClient from '../../../core/api/apiClient';

interface AuditLogQuery {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

interface AuditLog {
  _id: string;
  action: string;
  module: string;
  userId: { _id: string; name: string; email: string };
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditService = {
  list: async (query: AuditLogQuery = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));
    if (query.module) params.append('module', query.module);
    if (query.action) params.append('action', query.action);
    if (query.userId) params.append('userId', query.userId);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);

    const response = await apiClient.get<PaginatedResponse<AuditLog>>(`/audit-logs?${params.toString()}`);
    return response.data;
  },

  getModules: async () => {
    const response = await apiClient.get<{ data: string[] }>('/audit-logs/modules');
    return response.data.data;
  },
};