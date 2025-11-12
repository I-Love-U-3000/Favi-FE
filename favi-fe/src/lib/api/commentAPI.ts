import { fetchWrapper } from "@/lib/fetchWrapper";

type PagedResult<T> = { items: T[]; page: number; pageSize: number; totalCount: number };

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

export type CommentResponse = {
  id: string;
  postId: string;
  authorProfileId?: string;
  authorUsername?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string; // ISO
  updatedAt?: string;
  parentCommentId?: string | null;
};

export const commentAPI = {
  getByPost: async (postId: string, page = 1, pageSize = 20) =>
    camelize<PagedResult<CommentResponse>>(await fetchWrapper.get<any>(`/Comments/post/${postId}?page=${page}&pageSize=${pageSize}`, false)),

  create: async (payload: { postId: string; content: string; parentCommentId?: string | null }) =>
    camelize<CommentResponse>(await fetchWrapper.post<any>(`/Comments`, payload, true)),

  update: async (id: string, content: string) =>
    camelize<CommentResponse>(await fetchWrapper.put<any>(`/Comments/${id}`, { content }, true)),

  delete: async (id: string) => fetchWrapper.del<any>(`/Comments/${id}`, undefined, true),
};

export default commentAPI;

