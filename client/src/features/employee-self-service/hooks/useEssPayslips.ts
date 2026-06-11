import { useQuery } from '@tanstack/react-query';
import { essService } from '../services/essService';

export function useEssPayslips() {
  return useQuery({
    queryKey: ['ess', 'payslips'],
    queryFn: () => essService.getPayslips(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
