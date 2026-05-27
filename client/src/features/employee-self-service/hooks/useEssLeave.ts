import { useQuery } from '@tanstack/react-query';
import { essService } from '../services/essService';

export function useLeaveBalances() {
  return useQuery({
    queryKey: ['ess', 'leave', 'balances'],
    queryFn: () => essService.getLeaveBalances(),
  });
}

export function useLeaveApplications() {
  return useQuery({
    queryKey: ['ess', 'leave', 'applications'],
    queryFn: () => essService.getLeaveApplications(),
  });
}
