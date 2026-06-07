import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { essService } from '../services/essService';
import { message } from 'antd';

export function useMySwaps(params?: any) {
  return useQuery({
    queryKey: ['ess', 'my-swaps', params],
    queryFn: () => essService.getMySwaps(params),
  });
}

export function useSwapEligibility() {
  return useQuery({
    queryKey: ['ess', 'swap-eligibility'],
    queryFn: () => essService.getSwapEligibility(),
  });
}

export function useSwapPreference() {
  return useQuery({
    queryKey: ['ess', 'swap-preference'],
    queryFn: () => essService.getSwapPreference(),
  });
}

export function useEssRequestSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => essService.requestSwap(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Swap request submitted');
      queryClient.invalidateQueries({ queryKey: ['ess', 'my-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['ess', 'swap-eligibility'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to submit swap request'),
  });
}

export function useEssCancelSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => essService.cancelSwap(id),
    onSuccess: (res) => {
      message.success(res.message || 'Swap cancelled');
      queryClient.invalidateQueries({ queryKey: ['ess', 'my-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['ess', 'swap-eligibility'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to cancel swap'),
  });
}

export function useEssSetSwapPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => essService.setSwapPreference(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Preference saved');
      queryClient.invalidateQueries({ queryKey: ['ess', 'swap-preference'] });
    },
    onError: (err: any) => message.error(err?.response?.data?.message || 'Failed to save preference'),
  });
}
