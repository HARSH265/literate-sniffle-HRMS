import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { essService } from '../services/essService';
import { message } from 'antd';

export function useMyLoans() {
  return useQuery({
    queryKey: ['ess', 'loans'],
    queryFn: () => essService.getMyLoans(),
  });
}

export function useLoanTypes() {
  return useQuery({
    queryKey: ['ess', 'loan-types'],
    queryFn: () => essService.getLoanTypes(),
  });
}

export function useEssApplyLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { loanType: string; amount: number; tenure: number; purpose?: string }) =>
      essService.applyLoan(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Loan application submitted');
      queryClient.invalidateQueries({ queryKey: ['ess', 'loans'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to apply for loan');
    },
  });
}

export function useLoanDetail(id: string) {
  return useQuery({
    queryKey: ['ess', 'loan', id],
    queryFn: () => essService.getLoanDetail(id),
    enabled: !!id,
  });
}

export function useEssCancelLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => essService.cancelLoan(id),
    onSuccess: (res) => {
      message.success(res.message || 'Loan cancelled');
      queryClient.invalidateQueries({ queryKey: ['ess', 'loans'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to cancel loan');
    },
  });
}
