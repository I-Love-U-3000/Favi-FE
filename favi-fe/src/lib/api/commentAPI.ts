import { fetchWrapper } from "@/lib/fetchWrapper";

export const commentAPI = {
  create: (payload: { postId: string; content: string; parentCommentId?: string | null }) =>
    fetchWrapper.post<any>("/comments", {
      postId: payload.postId,
      content: payload.content,
      parentCommentId: payload.parentCommentId ?? null,
    }, true),

  update: (id: string, content: string) =>
    fetchWrapper.put<any>(`/comments/${id}`, { content }, true),

  delete: (id: string) =>
    fetchWrapper.del<any>(`/comments/${id}`, undefined, true),

  getByPost: (postId: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/comments/post/${postId}?page=${page}&pageSize=${pageSize}`, false),
};

export default commentAPI;
