import { api } from './client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export function fetchNotifications() {
  return api.get<AppNotification[]>('/notifications').then((r) => r.data);
}

export function fetchUnreadCount() {
  return api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data);
}

export function markNotificationRead(id: string) {
  return api.patch(`/notifications/${id}/read`).then((r) => r.data);
}

export function markAllNotificationsRead() {
  return api.patch('/notifications/read-all').then((r) => r.data);
}
