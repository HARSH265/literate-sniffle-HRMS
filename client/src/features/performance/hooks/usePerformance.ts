import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performanceService } from '../services/performanceService';
import { message } from 'antd';

export function usePerformanceCycles(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ['performance', 'cycles', params],
    queryFn: () => performanceService.listCycles(params),
  });
}

export function usePerformanceCycle(id: string) {
  return useQuery({
    queryKey: ['performance', 'cycles', id],
    queryFn: () => performanceService.getCycle(id),
    enabled: !!id,
  });
}

export function useCreatePerformanceCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof performanceService.createCycle>[0]) =>
      performanceService.createCycle(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Performance cycle created');
      queryClient.invalidateQueries({ queryKey: ['performance', 'cycles'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create cycle');
    },
  });
}

export function useUpdatePerformanceCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof performanceService.updateCycle>[1] }) =>
      performanceService.updateCycle(id, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Performance cycle updated');
      queryClient.invalidateQueries({ queryKey: ['performance', 'cycles'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update cycle');
    },
  });
}

export function usePerformanceReviews(params?: {
  page?: number;
  limit?: number;
  status?: string;
  cycleId?: string;
  employeeId?: string;
  search?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ['performance', 'reviews', params],
    queryFn: () => performanceService.listReviews(params),
  });
}

export function usePerformanceReview(id: string) {
  return useQuery({
    queryKey: ['performance', 'reviews', id],
    queryFn: () => performanceService.getReview(id),
    enabled: !!id,
  });
}

export function useSetGoals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, goals }: { reviewId: string; goals: Parameters<typeof performanceService.setGoals>[1] }) =>
      performanceService.setGoals(reviewId, goals),
    onSuccess: (res) => {
      message.success(res.message || 'Goals set successfully');
      queryClient.invalidateQueries({ queryKey: ['performance', 'reviews'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to set goals');
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: string; payload: Parameters<typeof performanceService.submitReview>[1] }) =>
      performanceService.submitReview(reviewId, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Review submitted');
      queryClient.invalidateQueries({ queryKey: ['performance', 'reviews'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to submit review');
    },
  });
}

export function useManagerReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: string; payload: Parameters<typeof performanceService.managerReview>[1] }) =>
      performanceService.managerReview(reviewId, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Manager review submitted');
      queryClient.invalidateQueries({ queryKey: ['performance', 'reviews'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to submit manager review');
    },
  });
}

export function useAppealReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      performanceService.appeal(reviewId, reason),
    onSuccess: (res) => {
      message.success(res.message || 'Appeal submitted');
      queryClient.invalidateQueries({ queryKey: ['performance', 'reviews'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to submit appeal');
    },
  });
}

export function useResolveAppeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, resolution, finalRating }: { reviewId: string; resolution: string; finalRating?: number }) =>
      performanceService.resolveAppeal(reviewId, resolution, finalRating),
    onSuccess: (res) => {
      message.success(res.message || 'Appeal resolved');
      queryClient.invalidateQueries({ queryKey: ['performance', 'reviews'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to resolve appeal');
    },
  });
}

export function useRequestFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, fromEmployeeId }: { reviewId: string; fromEmployeeId: string }) =>
      performanceService.requestFeedback(reviewId, fromEmployeeId),
    onSuccess: (res) => {
      message.success(res.message || 'Feedback requested');
      queryClient.invalidateQueries({ queryKey: ['performance', 'reviews'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to request feedback');
    },
  });
}
