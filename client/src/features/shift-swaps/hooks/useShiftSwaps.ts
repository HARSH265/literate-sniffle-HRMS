import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { shiftSwapService } from '../services/shiftSwapService';
import type { SwapListParams, RequestSwapPayload, SetPreferencePayload } from '../types/shiftSwapTypes';

export function useShiftSwaps(params?: SwapListParams) {
  return useQuery({
    queryKey: ['shift-swaps', params],
    queryFn: () => shiftSwapService.list(params),
  });
}

export function useMySwaps(params?: SwapListParams) {
  return useQuery({
    queryKey: ['my-swaps', params],
    queryFn: () => shiftSwapService.getMySwaps(params),
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-swap-approvals'],
    queryFn: () => shiftSwapService.getPendingApprovals(),
  });
}

export function useSwapEligibility() {
  return useQuery({
    queryKey: ['swap-eligibility'],
    queryFn: () => shiftSwapService.checkEligibility(),
  });
}

export function useSwapById(id: string) {
  return useQuery({
    queryKey: ['shift-swap', id],
    queryFn: () => shiftSwapService.getById(id),
    enabled: !!id,
  });
}

export function useRequestSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestSwapPayload) => shiftSwapService.requestSwap(payload),
    onSuccess: () => {
      message.success('Swap request submitted');
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['my-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['swap-eligibility'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to submit swap request'),
  });
}

export function useApproveSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shiftSwapService.approveSwap(id),
    onSuccess: () => {
      message.success('Swap approved');
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['pending-swap-approvals'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to approve swap'),
  });
}

export function useRejectSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => shiftSwapService.rejectSwap(id, reason),
    onSuccess: () => {
      message.success('Swap rejected');
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['pending-swap-approvals'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to reject swap'),
  });
}

export function useCancelSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shiftSwapService.cancelSwap(id),
    onSuccess: () => {
      message.success('Swap cancelled');
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['my-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['swap-eligibility'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to cancel swap'),
  });
}

export function useShiftPreference() {
  return useQuery({
    queryKey: ['shift-preference'],
    queryFn: () => shiftSwapService.getPreference(),
  });
}

export function useSetShiftPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetPreferencePayload) => shiftSwapService.setPreference(payload),
    onSuccess: () => {
      message.success('Preference saved');
      queryClient.invalidateQueries({ queryKey: ['shift-preference'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to save preference'),
  });
}
