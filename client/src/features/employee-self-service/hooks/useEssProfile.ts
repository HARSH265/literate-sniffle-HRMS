import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { essService } from '../services/essService';
import { message } from 'antd';

export function useEssProfile() {
  return useQuery({
    queryKey: ['ess', 'profile'],
    queryFn: () => essService.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => essService.updateProfile(payload),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Profile updated');
      queryClient.invalidateQueries({ queryKey: ['ess', 'profile'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update profile');
    },
  });
}

export function useChangeRequests(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['ess', 'change-requests', params],
    queryFn: () => essService.getChangeRequests(params),
  });
}

export function useAllChangeRequests(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['ess', 'all-change-requests', params],
    queryFn: () => essService.getAllChangeRequests(params),
  });
}

export function useCreateChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { field: string; newValue: unknown; notes?: string }) => essService.createChangeRequest(payload),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Change request submitted');
      queryClient.invalidateQueries({ queryKey: ['ess', 'change-requests'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to submit change request');
    },
  });
}

export function useApproveChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => essService.approveChangeRequest(id, notes),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Change request approved');
      queryClient.invalidateQueries({ queryKey: ['ess', 'all-change-requests'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to approve');
    },
  });
}

export function useRejectChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => essService.rejectChangeRequest(id, reason),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Change request rejected');
      queryClient.invalidateQueries({ queryKey: ['ess', 'all-change-requests'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to reject');
    },
  });
}

export function useEssStats() {
  return useQuery({
    queryKey: ['ess', 'stats'],
    queryFn: () => essService.getStats(),
  });
}
