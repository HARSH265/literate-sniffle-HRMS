import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementService, Announcement } from '../services/announcementService';
import { message } from 'antd';

export function useAnnouncements(params?: {
  page?: number;
  limit?: number;
  priority?: string;
  status?: string;
  search?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: () => announcementService.list(params),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: ['announcements', id],
    queryFn: () => announcementService.getById(id),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof announcementService.create>[0]) =>
      announcementService.create(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Announcement created');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to create announcement');
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof announcementService.update>[1] }) =>
      announcementService.update(id, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Announcement updated');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to update announcement');
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => announcementService.delete(id),
    onSuccess: (res) => {
      message.success(res.message || 'Announcement deleted');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Failed to delete announcement');
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => announcementService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['announcements', 'unread-count'],
    queryFn: () => announcementService.getUnreadCount(),
    refetchInterval: 60000,
  });
}
