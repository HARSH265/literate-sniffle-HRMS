import { useQuery } from '@tanstack/react-query';
import { essService } from '../services/essService';

export function useEssPayslips() {
  return useQuery({
    queryKey: ['ess', 'payslips'],
    queryFn: () => essService.getPayslips(),
  });
}
