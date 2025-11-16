import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  CommentResponse,
  CommentTreeResponse,
  CreateCommentRequest,
  PagedResult,
  ReactionType,
  UpdateCommentRequest,
} from "@/types";

function isPlainObject(val: any) {
  return Object.prototype.toString.call(val) === "[object Object]";
}
function camelKey(k: string): string { return k ? k[0].toLowerCase() + k.slice(1) : k; }
function camelize<T = any>(input: any): T {
  if (Array.isArray(input)) return input.map(camelize) as any;
  if (!isPlainObject(input)) return input;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input)) out[camelKey(k)] = camelize(v);
  return out as T;
}

export const commentAPI = {
  getByPost: async (postId: string, page = 1, pageSize = 20) =>
    camelize<PagedResult<CommentTreeResponse>>(
      await fetchWrapper.get<any>(`/Comments/post/${postId}?page=${page}&pageSize=${pageSize}`, true)
    ),

  create: async (payload: CreateCommentRequest) =>
    camelize<CommentResponse>(await fetchWrapper.post<any>(`/Comments`, payload, true)),

  update: async (id: string, payload: UpdateCommentRequest) =>
    camelize<CommentResponse>(
      await fetchWrapper.put<any>(`/Comments/${id}`, payload, true)
    ),

  delete: async (id: string) => fetchWrapper.del<any>(`/Comments/${id}`, undefined, true),

  toggleReaction: async (id: string, type: ReactionType) =>
    camelize(await fetchWrapper.post<any>(`/Comments/${id}/reactions?type=${encodeURIComponent(type)}`, undefined, true)),
};

export default commentAPI;

