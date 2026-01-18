"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import { useOverlay } from "@/components/RootProvider";
import { PagedResult, CommentDto } from "@/lib/api/admin";

export interface CommentsFilter {
  search?: string;
  postId?: string;
  authorId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  skip?: number;
  take?: number;
}

export function useAdminComments(filters: CommentsFilter = {}) {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.postId) queryParams.append("postId", filters.postId);
  if (filters.authorId) queryParams.append("authorId", filters.authorId);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.startDate) queryParams.append("startDate", filters.startDate);
  if (filters.endDate) queryParams.append("endDate", filters.endDate);
  if (filters.skip) queryParams.append("skip", filters.skip.toString());
  if (filters.take) queryParams.append("take", filters.take.toString());

  return useQuery({
    queryKey: ["admin", "comments", filters],
    queryFn: () =>
      fetchWrapper.get<PagedResult<CommentDto>>(
        `/api/admin/comments?${queryParams.toString()}`
      ),
  });
}

export function useComment(commentId: string) {
  return useQuery<CommentDto>({
    queryKey: ["admin", "comments", commentId],
    queryFn: () => fetchWrapper.get<CommentDto>(`/api/admin/comments/${commentId}`),
    enabled: !!commentId,
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason?: string }) =>
      fetchWrapper.del(`/api/admin/content/comments/${commentId}`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Comment has been deleted",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to delete comment",
      });
    },
  });
}

export function useBulkDeleteComments() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ commentIds, reason }: { commentIds: string[]; reason?: string }) =>
      fetchWrapper.post("/api/admin/content/comments/bulk/delete", { commentIds, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Comments have been deleted",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to delete comments",
      });
    },
  });
}

export function useCommentStats() {
  return useQuery<{
    total: number;
    deleted: number;
    hidden: number;
    active: number;
  }>({
    queryKey: ["admin", "comments", "stats"],
    queryFn: () => fetchWrapper.get("/api/admin/comments/stats"),
  });
}
