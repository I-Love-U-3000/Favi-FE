import { fetchWrapper } from "@/lib/fetchWrapper";
import type { PaginationResult, PostResponse } from "@/types";

function isPlainObject(val: any) {
  return Object.prototype.toString.call(val) === "[object Object]";
}
function camelKey(k: string): string {
  if (!k) return k;
  return k[0].toLowerCase() + k.slice(1);
}
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

export const tagAPI = {
  getPaged: (page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/tags?page=${page}&pageSize=${pageSize}`, false),

  getById: (id: string) => fetchWrapper.get<any>(`/tags/${id}`, false),

  getPosts: async (id: string, page = 1, size = 10, pageSize?: number) => {
    const actualSize = pageSize || size;
    const res = await fetchWrapper.get<any>(
      `/tags/${id}/posts?page=${page}&size=${actualSize}`,
      false
    );
    return normalizePagination<PostResponse>(res);
  },
};

export default tagAPI;

