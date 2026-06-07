import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '../services/trainingService';
import { message } from 'antd';

export function useTrainingPrograms(params?: { page?: number; limit?: number; search?: string; status?: string; category?: string }) {
  return useQuery({
    queryKey: ['training', 'programs', params],
    queryFn: () => trainingService.listPrograms(params),
  });
}

export function useCreateTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof trainingService.createProgram>[0]) => trainingService.createProgram(payload),
    onSuccess: (res) => { message.success(res.message || 'Program created'); queryClient.invalidateQueries({ queryKey: ['training', 'programs'] }); },
    onError: (err: any) => { message.error(err?.response?.data?.message || 'Failed to create program'); },
  });
}

export function useCancelTrainingProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingService.cancelProgram(id),
    onSuccess: (res) => { message.success(res.message || 'Program cancelled'); queryClient.invalidateQueries({ queryKey: ['training', 'programs'] }); },
    onError: (err: any) => { message.error(err?.response?.data?.message || 'Failed to cancel program'); },
  });
}

export function useEnrollEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { trainingId: string; employeeId: string }) => trainingService.enrollEmployee(payload),
    onSuccess: (res) => { message.success(res.message || 'Employee enrolled'); queryClient.invalidateQueries({ queryKey: ['training', 'enrollments'] }); },
    onError: (err: any) => { message.error(err?.response?.data?.message || 'Failed to enroll'); },
  });
}

export function useBatchEnroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { trainingId: string; employeeIds: string[] }) => trainingService.batchEnroll(payload),
    onSuccess: (res) => { message.success(res.message || 'Employees enrolled'); queryClient.invalidateQueries({ queryKey: ['training', 'enrollments'] }); },
    onError: (err: any) => { message.error(err?.response?.data?.message || 'Failed to batch enroll'); },
  });
}

export function useCompleteEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: Parameters<typeof trainingService.completeEnrollment>[1] }) => trainingService.completeEnrollment(id, payload),
    onSuccess: (res) => { message.success(res.message || 'Enrollment completed'); queryClient.invalidateQueries({ queryKey: ['training', 'enrollments'] }); },
    onError: (err: any) => { message.error(err?.response?.data?.message || 'Failed to complete'); },
  });
}

export function useDropEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trainingService.dropEnrollment(id),
    onSuccess: (res) => { message.success(res.message || 'Enrollment dropped'); queryClient.invalidateQueries({ queryKey: ['training', 'enrollments'] }); },
    onError: (err: any) => { message.error(err?.response?.data?.message || 'Failed to drop'); },
  });
}

export function useTrainingStats() {
  return useQuery({
    queryKey: ['training', 'stats'],
    queryFn: () => trainingService.getStats(),
  });
}

export function useTrainingMyEnrollments() {
  return useQuery({
    queryKey: ['training', 'enrollments', 'my'],
    queryFn: () => trainingService.getMyEnrollments(),
  });
}
