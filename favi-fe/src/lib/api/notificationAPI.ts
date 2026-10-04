import { fetchWrapper } from "@/lib/fetchWrapper";
import { NotificationDto, PagedResult, PaginationResult } from "@/types";

function normalizePagination<T>(res: any): PaginationResult<T> & { items: T[]; pageSize: number; totalCount: number } {
  const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []));
  const page = typeof res?.page === "number" ? res.page : 1;
  const size = typeof res?.size === "number" ? res.size : (typeof res?.pageSize === "number" ? res.pageSize : data.length);
  const hasPrevious = typeof res?.hasPrevious === "boolean" ? res.hasPrevious : page > 1;
  const hasNext = typeof res?.hasNext === "boolean" ? res.hasNext : false;
  return {
    ...res,
    data,
    items: data,
    page,
    size,
    pageSize: size,
    hasPrevious,
    hasNext,
    totalCount: typeof res?.totalCount === "number" ? res.totalCount : data.length,
  };
}

export const notificationAPI = {
  getNotifications: async (page = 1, size = 10) => {
    const res = await fetchWrapper.get<any>(
      `/notifications?page=${page}&size=${size}`,
      true
    );
    return normalizePagination<NotificationDto>(res);
  },

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

  deleteNotification: (notificationId: string) =>
    fetchWrapper.del<void>(
      `/notifications/${notificationId}`,
      undefined,
      true
    ),

  deleteAllRead: () =>
    fetchWrapper.del<{ message: string; count: number }>(
      `/notifications/read`,
      undefined,
      true
    ),
};

export default notificationAPI;
