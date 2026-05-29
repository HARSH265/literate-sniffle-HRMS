import { useQuery } from '@tanstack/react-query';
import { essService } from '../services/essService';

export function useEssAssets() {
  return useQuery({
    queryKey: ['ess', 'assets'],
    queryFn: () => essService.getAssets(),
  });
}
