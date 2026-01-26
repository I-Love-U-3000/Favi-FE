"use client";

import { useState, useEffect } from "react";
import { useSignalRContext } from "@/lib/contexts/SignalRContext";
import { NotificationItem } from "@/components/NotificationItem";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

export function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useSignalRContext();

  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMoreNotifications(1);
  }, []);

  const loadMoreNotifications = async (pageNum?: number) => {
    const currentPage = pageNum ?? page;
    setIsLoading(true);
    try {
      const result = await fetchNotifications(currentPage, 20);

      if (result) {
        setTotalCount(result.totalCount);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMoreNotifications(nextPage);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead();
      if (success) {
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setTotalCount(0);
    loadMoreNotifications(1);
    toast({
      title: "Refreshed",
      description: "Notifications have been refreshed",
    });
  };

  // Calculate if there are more items using the backend's totalCount
  const hasMore = page * 20 < totalCount;

  return (
    <>
      <style>{`.notif-item-panel:hover { background-color: var(--bg) !important; }`}</style>
      <div className="relative" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div
        className="p-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh notifications"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                Mark all as read
              </button>
            )}
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              title={isConnected ? "Connected" : "Disconnected"}
            />
          </div>
        </div>
        {unreadCount > 0 && (
          <p className="text-sm opacity-70 mt-1">
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center opacity-70">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}

        {hasMore && notifications.length > 0 && (
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="w-full p-3 text-center text-sm notif-item-panel transition-colors disabled:opacity-50 hover:bg-white/5"
            style={{ color: 'var(--primary)' }}
          >
            {isLoading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
    </>
  );
}
