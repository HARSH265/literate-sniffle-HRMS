import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../../../../core/api/apiClient';
import { helpdeskService } from '../helpdeskService';

vi.mock('../../../../core/api/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('helpdeskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('calls GET /helpdesk with params', async () => {
      const response = { success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      mockApiClient.get.mockResolvedValue({ data: response });
      const result = await helpdeskService.list({ page: 1, limit: 20 });
      expect(result).toEqual(response);
      expect(mockApiClient.get).toHaveBeenCalledWith('/helpdesk', { params: { page: 1, limit: 20 } });
    });

    it('calls GET /helpdesk without params', async () => {
      mockApiClient.get.mockResolvedValue({ data: { success: true, data: [] } });
      await helpdeskService.list();
      expect(mockApiClient.get).toHaveBeenCalledWith('/helpdesk', { params: undefined });
    });
  });

  describe('getById', () => {
    it('calls GET /helpdesk/:id', async () => {
      const response = { success: true, data: { _id: '1', subject: 'Test' } };
      mockApiClient.get.mockResolvedValue({ data: response });
      const result = await helpdeskService.getById('1');
      expect(result).toEqual(response);
      expect(mockApiClient.get).toHaveBeenCalledWith('/helpdesk/1');
    });
  });

  describe('create', () => {
    it('calls POST /helpdesk with payload', async () => {
      const payload = { subject: 'Issue', description: 'Details', category: 'it', priority: 'high' };
      const response = { success: true, data: { _id: '1', ...payload }, message: 'Ticket created' };
      mockApiClient.post.mockResolvedValue({ data: response });
      const result = await helpdeskService.create(payload);
      expect(result).toEqual(response);
      expect(mockApiClient.post).toHaveBeenCalledWith('/helpdesk', payload);
    });
  });

  describe('update', () => {
    it('calls PUT /helpdesk/:id with payload', async () => {
      const payload = { subject: 'Updated', priority: 'urgent' };
      const response = { success: true, data: { _id: '1', ...payload }, message: 'Ticket updated' };
      mockApiClient.put.mockResolvedValue({ data: response });
      const result = await helpdeskService.update('1', payload);
      expect(result).toEqual(response);
      expect(mockApiClient.put).toHaveBeenCalledWith('/helpdesk/1', payload);
    });
  });

  describe('addComment', () => {
    it('calls POST /helpdesk/:id/comments with payload', async () => {
      const payload = { message: 'Working on it' };
      const response = { success: true, data: { _id: '1', comments: [{ message: 'Working on it' }] }, message: 'Comment added' };
      mockApiClient.post.mockResolvedValue({ data: response });
      const result = await helpdeskService.addComment('1', payload);
      expect(result).toEqual(response);
      expect(mockApiClient.post).toHaveBeenCalledWith('/helpdesk/1/comments', payload);
    });
  });

  describe('delete', () => {
    it('calls DELETE /helpdesk/:id', async () => {
      const response = { success: true, message: 'Ticket deleted' };
      mockApiClient.delete.mockResolvedValue({ data: response });
      const result = await helpdeskService.delete('1');
      expect(result).toEqual(response);
      expect(mockApiClient.delete).toHaveBeenCalledWith('/helpdesk/1');
    });
  });
});
