import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export type NotificationType =
  | 'upvote_project'
  | 'upvote_idea'
  | 'collaborator_invite'
  | 'collaborator_joined'
  | 'interest_expressed';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  data?: {
    projectId?: string;
    ideaId?: string;
    userId?: string;
  };
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

const NOTIFICATIONS_KEY = 'notifications';
const UNREAD_COUNT_KEY = 'unread-count';

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams: Record<string, string> = {
        page: String(pageParam),
        limit: '20',
      };
      return api.get<NotificationsResponse>('/notifications', queryParams);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [UNREAD_COUNT_KEY],
    queryFn: () => api.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'upvote_project':
    case 'upvote_idea':
      return '▲';
    case 'collaborator_invite':
      return '📨';
    case 'collaborator_joined':
      return '🤝';
    case 'interest_expressed':
      return '💡';
    default:
      return '🔔';
  }
}
