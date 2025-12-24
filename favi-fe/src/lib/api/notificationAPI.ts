import { fetchWrapper } from "@/lib/fetchWrapper";
import { NotificationDto, PagedResult } from "@/types";

export const notificationAPI = {
  getNotifications: (page = 1, pageSize = 20) =>
    fetchWrapper.get<PagedResult<NotificationDto>>(
      `/notifications?page=${page}&pageSize=${pageSize}`,
      true
    ),

  getUnreadCount: () =>
    fetchWrapper.get<number>(
      `/notifications/unread-count`,
      true
    ),

  markAsRead: (notificationId: string) =>
    fetchWrapper.put<void>(
      `/notifications/${notificationId}/read`,
      undefined,
      true
    ),

  markAllAsRead: () =>
    fetchWrapper.put<void>(
      `/notifications/read-all`,
      undefined,
      true
    ),
};

export default notificationAPI;
