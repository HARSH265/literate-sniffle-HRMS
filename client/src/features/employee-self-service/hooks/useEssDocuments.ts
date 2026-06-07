import { useQuery } from '@tanstack/react-query';
import { essService } from '../services/essService';

export function useEssDocuments() {
  return useQuery({
    queryKey: ['ess', 'documents'],
    queryFn: () => essService.getDocuments(),
  });
}
