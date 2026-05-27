import { useQuery } from '@tanstack/react-query';
import { essService } from '../services/essService';

export function useEssAttendance(month: string) {
  return useQuery({
    queryKey: ['ess', 'attendance', month],
    queryFn: () => essService.getAttendance(month),
    enabled: !!month,
  });
}
