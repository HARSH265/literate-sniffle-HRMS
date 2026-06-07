import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '../services/assetService';
import { message } from 'antd';

export function useAssets(params?: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  assignedTo?: string;
  search?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => assetService.list(params),
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => assetService.getById(id),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof assetService.create>[0]) =>
      assetService.create(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Asset created');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create asset');
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof assetService.update>[1] }) =>
      assetService.update(id, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Asset updated');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update asset');
    },
  });
}

export function useAllocateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, employeeId, notes }: { assetId: string; employeeId: string; notes?: string }) =>
      assetService.allocate(assetId, employeeId, notes),
    onSuccess: (res) => {
      message.success(res.message || 'Asset allocated');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to allocate asset');
    },
  });
}

export function useReturnAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, condition, notes }: { assetId: string; condition?: string; notes?: string }) =>
      assetService.returnAsset(assetId, condition, notes),
    onSuccess: (res) => {
      message.success(res.message || 'Asset returned');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to return asset');
    },
  });
}

export function useMarkMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, notes }: { assetId: string; notes?: string }) =>
      assetService.markMaintenance(assetId, notes),
    onSuccess: (res) => {
      message.success(res.message || 'Asset marked as maintenance');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to mark maintenance');
    },
  });
}

export function useRetireAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assetId, notes }: { assetId: string; notes?: string }) =>
      assetService.retire(assetId, notes),
    onSuccess: (res) => {
      message.success(res.message || 'Asset retired');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to retire asset');
    },
  });
}

export function useAssetStats() {
  return useQuery({
    queryKey: ['assets', 'stats'],
    queryFn: () => assetService.getStats(),
  });
}

export function useEmployeeAssets(employeeId: string) {
  return useQuery({
    queryKey: ['assets', 'employee', employeeId],
    queryFn: () => assetService.getEmployeeAssets(employeeId),
    enabled: !!employeeId,
  });
}
