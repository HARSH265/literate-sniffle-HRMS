import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/documentService';
import { message } from 'antd';

export function useDocuments(params?: {
  page?: number;
  limit?: number;
  category?: string;
  employee?: string;
  isCompanyDocument?: boolean;
  search?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentService.list(params),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentService.getById(id),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => documentService.upload(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Document uploaded');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to upload document');
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData }) =>
      documentService.update(id, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Document updated');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update document');
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: (res) => {
      message.success(res.message || 'Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to delete document');
    },
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['documents', 'stats'],
    queryFn: () => documentService.getStats(),
  });
}
