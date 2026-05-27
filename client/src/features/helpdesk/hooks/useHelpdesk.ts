import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { helpdeskService } from '../services/helpdeskService';
import { message } from 'antd';

export function useTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sort?: string;
  userId?: string;
  assignedTo?: string;
}) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => helpdeskService.list(params),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => helpdeskService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof helpdeskService.create>[0]) =>
      helpdeskService.create(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Ticket created');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create ticket');
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof helpdeskService.update>[1] }) =>
      helpdeskService.update(id, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Ticket updated');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update ticket');
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof helpdeskService.addComment>[1] }) =>
      helpdeskService.addComment(id, payload),
    onSuccess: () => {
      message.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to add comment');
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => helpdeskService.delete(id),
    onSuccess: (res) => {
      message.success(res.message || 'Ticket deleted');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to delete ticket');
    },
  });
}
