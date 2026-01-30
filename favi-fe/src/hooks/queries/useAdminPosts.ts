"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWrapper } from "@/lib/fetchWrapper";
import { useOverlay } from "@/components/RootProvider";
import { PagedResult, PostDto } from "@/lib/api/admin";

export interface PostsFilter {
  search?: string;
  privacy?: string;
  status?: string;
  authorId?: string;
  skip?: number;
  take?: number;
}

export function useAdminPosts(filters: PostsFilter = {}) {
  const queryParams = new URLSearchParams();
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.privacy) queryParams.append("privacy", filters.privacy);
  if (filters.status) queryParams.append("status", filters.status);
  if (filters.authorId) queryParams.append("authorId", filters.authorId);

  // Convert skip/take to page/pageSize for backend compatibility
  if (filters.skip !== undefined && filters.take) {
    const page = Math.floor(filters.skip / filters.take) + 1;
    queryParams.append("page", page.toString());
    queryParams.append("pageSize", filters.take.toString());
  } else if (filters.take) {
    queryParams.append("page", "1");
    queryParams.append("pageSize", filters.take.toString());
  }

  return useQuery({
    queryKey: ["admin", "posts", filters],
    queryFn: () =>
      fetchWrapper.get<PagedResult<PostDto>>(
        `/admin/analytics/posts?${queryParams.toString()}`
      ),
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ["admin", "posts", postId],
    queryFn: () => fetchWrapper.get<PostDto>(`/posts/${postId}`),
    enabled: !!postId,
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason?: string }) =>
      fetchWrapper.del(`/admin/content/posts/${postId}`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Post has been deleted",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to delete post",
      });
    },
  });
}

export function useBulkDeletePosts() {
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  return useMutation({
    mutationFn: ({ postIds, reason }: { postIds: string[]; reason?: string }) =>
      fetchWrapper.post(`/admin/content/posts/bulk/delete`, { postIds, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Posts have been deleted",
      });
    },
    onError: (error: any) => {
      showToast({
        severity: "error",
        summary: "Error",
        detail: error?.message || "Failed to delete posts",
      });
    },
  });
}
