import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  CommentReactionResponse,
  CommentResponse,
  CommentTreeResponse,
  CreateCommentRequest,
  PagedResult,
  PaginationResult,
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

function normalizePagination<T>(res: any): PaginationResult<T> & { items: T[]; pageSize: number; totalCount: number } {
  const c = camelize(res);
  const data = Array.isArray(c?.data) ? c.data : (Array.isArray(c?.items) ? c.items : (Array.isArray(c) ? c : []));
  const page = typeof c?.page === "number" ? c.page : 1;
  const size = typeof c?.size === "number" ? c.size : (typeof c?.pageSize === "number" ? c.pageSize : data.length);
  const hasPrevious = typeof c?.hasPrevious === "boolean" ? c.hasPrevious : page > 1;
  const hasNext = typeof c?.hasNext === "boolean" ? c.hasNext : false;
  return {
    ...c,
    data,
    items: data,
    page,
    size,
    pageSize: size,
    hasPrevious,
    hasNext,
    totalCount: typeof c?.totalCount === "number" ? c.totalCount : data.length,
  };
}

export const commentAPI = {
  getByPost: async (postId: string, page = 1, size = 10) =>
    normalizePagination<CommentTreeResponse>(
      await fetchWrapper.get<any>(`/Comments/post/${postId}?page=${page}&size=${size}`, true)
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

  getReactors: async (commentId: string, page = 1, size = 10) =>
    normalizePagination<CommentReactionResponse>(
      await fetchWrapper.get<any>(`/Comments/${commentId}/reactors?page=${page}&size=${size}`, true)
    ),
};

export default commentAPI;
