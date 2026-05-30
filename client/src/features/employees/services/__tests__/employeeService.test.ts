import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../core/api/apiClient';
import { employeeService } from '../employeeService';

vi.mock('../../../../core/api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

describe('employeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNextCode', () => {
    it('returns employee code from response', async () => {
      mockApiClient.get.mockResolvedValue({ data: { data: { employeeCode: 'EMP001' } } });
      const code = await employeeService.getNextCode();
      expect(code).toBe('EMP001');
      expect(mockApiClient.get).toHaveBeenCalledWith('/employees/next-code');
    });
  });

  describe('list', () => {
    it('calls GET /employees with params', async () => {
      const response = { success: true, message: '', data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      mockApiClient.get.mockResolvedValue({ data: response });
      const result = await employeeService.list({ page: 1, limit: 10 });
      expect(result).toEqual(response);
      expect(mockApiClient.get).toHaveBeenCalledWith('/employees', { params: { page: 1, limit: 10 } });
    });

    it('works without params', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, message: '', data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } } });
      await employeeService.list();
      expect(mockApiClient.get).toHaveBeenCalledWith('/employees', { params: undefined });
    });
  });

  describe('getById', () => {
    it('calls GET /employees/:id', async () => {
      const employee = { id: 'abc', fullName: 'John' };
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: employee } });
      const result = await employeeService.getById('abc');
      expect(result.data).toEqual(employee);
      expect(mockApiClient.get).toHaveBeenCalledWith('/employees/abc');
    });
  });

  describe('create', () => {
    it('calls POST /employees with payload', async () => {
      const payload = { fullName: 'John', fatherName: 'Doe', category: 'worker' as const, employmentType: 'permanent' as const, department: 'dept1', designation: 'desig1', shift: 'shift1', joiningDate: '2024-01-01', salaryType: 'monthly' as const, baseSalary: 25000 };
      const employee = { id: 'abc', ...payload };
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: employee } });
      const result = await employeeService.create(payload);
      expect(result.data).toEqual(employee);
      expect(mockApiClient.post).toHaveBeenCalledWith('/employees', payload);
    });
  });

  describe('update', () => {
    it('calls PUT /employees/:id with payload', async () => {
      mockApiClient.put.mockResolvedValue({ data: { success: true, data: { id: 'abc', fullName: 'Jane' } } });
      const result = await employeeService.update('abc', { fullName: 'Jane' });
      expect(result.data.fullName).toBe('Jane');
      expect(mockApiClient.put).toHaveBeenCalledWith('/employees/abc', { fullName: 'Jane' });
    });
  });

  describe('delete', () => {
    it('calls DELETE /employees/:id', async () => {
      mockApiClient.delete.mockResolvedValue({});
      await employeeService.delete('abc');
      expect(mockApiClient.delete).toHaveBeenCalledWith('/employees/abc');
    });
  });

  describe('export', () => {
    it('calls GET /employees/export as blob', async () => {
      const blob = new Blob(['data']);
      mockApiClient.get.mockResolvedValue({ data: blob });
      const result = await employeeService.export();
      expect(result).toBe(blob);
      expect(mockApiClient.get).toHaveBeenCalledWith('/employees/export', { responseType: 'blob' });
    });
  });

  describe('downloadTemplate', () => {
    it('calls GET /employees/template as blob', async () => {
      const blob = new Blob(['template']);
      mockApiClient.get.mockResolvedValue({ data: blob });
      const result = await employeeService.downloadTemplate();
      expect(result).toBe(blob);
      expect(mockApiClient.get).toHaveBeenCalledWith('/employees/template', { responseType: 'blob' });
    });
  });

  describe('import', () => {
    it('calls POST /employees/import with FormData', async () => {
      const file = new File([''], 'test.xlsx');
      const importResult = { success: 5, failed: 1, errors: ['Row 3: invalid email'] };
      mockApiClient.post.mockResolvedValue({ data: importResult });
      const result = await employeeService.import(file);
      expect(result).toEqual(importResult);
      expect(mockApiClient.post).toHaveBeenCalledWith('/employees/import', expect.any(FormData), { headers: { 'Content-Type': 'multipart/form-data' } });
      const formData = mockApiClient.post.mock.calls[0][1];
      expect(formData.get('file')).toBe(file);
    });
  });

  describe('uploadDocument', () => {
    it('calls POST /employees/:id/documents with FormData', async () => {
      const file = new File([''], 'doc.pdf');
      mockApiClient.post.mockResolvedValue({ data: { success: true, data: {} } });
      const result = await employeeService.uploadDocument('emp1', file, 'aadhar');
      expect(result).toEqual({ success: true, data: {} });
      expect(mockApiClient.post).toHaveBeenCalledWith('/employees/emp1/documents', expect.any(FormData), { headers: { 'Content-Type': 'multipart/form-data' } });
      const formData = mockApiClient.post.mock.calls[0][1];
      expect(formData.get('file')).toBe(file);
      expect(formData.get('documentType')).toBe('aadhar');
    });
  });

  describe('deleteDocument', () => {
    it('calls DELETE /employees/:id/documents/:docId', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });
      const result = await employeeService.deleteDocument('emp1', 'doc1');
      expect(result).toEqual({ success: true });
      expect(mockApiClient.delete).toHaveBeenCalledWith('/employees/emp1/documents/doc1');
    });
  });

  describe('getDocumentUrl', () => {
    it('returns document URL string', () => {
      const url = employeeService.getDocumentUrl('emp1', 'doc1');
      expect(url).toContain('/employees/emp1/documents/doc1');
    });
  });
});
