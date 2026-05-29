import apiClient from '../../../core/api/apiClient';

export interface DocumentFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Document {
  _id: string;
  title: string;
  description?: string;
  category: string;
  file: DocumentFile;
  employee?: { _id: string; fullName: string; employeeCode: string };
  isCompanyDocument: boolean;
  version: number;
  previousVersions: {
    file: DocumentFile;
    version: number;
    uploadedBy: { _id: string; name: string; email: string };
    uploadedAt: string;
  }[];
  tags: string[];
  expiryDate?: string;
  expiryNotificationSent: boolean;
  accessRoles: string[];
  uploadedBy: { _id: string; name: string; email: string };
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListParams {
  page?: number;
  limit?: number;
  category?: string;
  employee?: string;
  isCompanyDocument?: boolean;
  search?: string;
  sort?: string;
}

export const documentService = {
  async list(params?: ListParams): Promise<{ success: boolean; data: Document[]; meta: any }> {
    const { data } = await apiClient.get('/documents', { params });
    return data;
  },

  async getById(id: string): Promise<{ success: boolean; data: Document }> {
    const { data } = await apiClient.get(`/documents/${id}`);
    return data;
  },

  async upload(payload: FormData): Promise<{ success: boolean; data: Document; message: string }> {
    const { data } = await apiClient.post('/documents', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async update(id: string, payload: FormData): Promise<{ success: boolean; data: Document; message: string }> {
    const { data } = await apiClient.patch(`/documents/${id}`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete(`/documents/${id}`);
    return data;
  },

  async getCompanyDocuments(): Promise<{ success: boolean; data: Document[] }> {
    const { data } = await apiClient.get('/documents/company');
    return data;
  },

  async getEmployeeDocuments(employeeId: string): Promise<{ success: boolean; data: Document[] }> {
    const { data } = await apiClient.get(`/documents/employee/${employeeId}`);
    return data;
  },

  async getStats(): Promise<{
    success: boolean;
    data: { total: number; byCategory: Record<string, { count: number; totalSize: number }>; employeeDocs: number; companyDocs: number; expiringSoon: number };
  }> {
    const { data } = await apiClient.get('/documents/stats');
    return data;
  },

  getDownloadUrl(id: string): string {
    return `/documents/${id}/download`;
  },
};
