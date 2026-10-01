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
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const loadNotifications = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const result = await fetchNotifications(pageNum, 10);
      if (result) {
        setHasNext(result.hasNext ?? false);
        setPage(result.page || pageNum);
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

  const handleLoadMore = async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await fetchNotifications(nextPage, 10);
      if (result) {
        setHasNext(result.hasNext ?? false);
        setPage(result.page || nextPage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more notifications",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
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
    loadNotifications(1);
    toast({
      title: "Refreshed",
      description: "Notifications have been refreshed",
    });
  };

  const hasMore = hasNext;

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
          <div className="p-3 flex justify-center border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2 rounded-full font-medium text-xs transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary, #3b82f6)",
                color: "white",
              }}
            >
              {loadingMore ? (
                <>
                  <i className="pi pi-spin pi-spinner text-xs" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load more</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
