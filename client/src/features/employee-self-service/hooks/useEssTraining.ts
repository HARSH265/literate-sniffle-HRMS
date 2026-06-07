import { useQuery } from '@tanstack/react-query';
import { essService } from '../services/essService';

export function useEssTraining() {
  return useQuery({
    queryKey: ['ess', 'training'],
    queryFn: () => essService.getMyTraining(),
  });
}
