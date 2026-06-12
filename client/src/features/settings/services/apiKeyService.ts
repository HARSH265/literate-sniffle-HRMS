import apiClient from '../../../core/api/apiClient';

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateApiKeyPayload {
  name: string;
  permissions: string[];
  rateLimit?: number;
  expiresInDays?: number;
}

export interface CreateApiKeyResponse {
  key: string;
  name: string;
  prefix: string;
  permissions: string[];
  expiresAt?: string;
}

export interface PaginatedApiKeys {
  data: ApiKey[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const apiKeyService = {
  async list(params?: { page?: number; limit?: number }): Promise<PaginatedApiKeys> {
    const { data } = await apiClient.get<PaginatedApiKeys>('/api-keys', { params });
    return data;
  },

  async create(payload: CreateApiKeyPayload): Promise<{ success: boolean; data: CreateApiKeyResponse; message: string }> {
    const { data } = await apiClient.post('/api-keys', payload);
    return data;
  },

  async revoke(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete(`/api-keys/${id}`);
    return data;
  },
};
