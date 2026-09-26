import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CollectionResponse,
  CreateCollectionFormData,
  UpdateCollectionFormData,
  CollectionReactionResponse,
  PostResponse,
  PaginationResult,
} from "@/types";

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

// Helper to build FormData for collection operations
function buildCollectionFormData(
  data: CreateCollectionRequest | UpdateCollectionRequest,
  coverImage?: File | null
): FormData {
  const formData = new FormData();

  // Add all request fields to FormData
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  // Add cover image if provided
  if (coverImage) {
    formData.append("coverImage", coverImage);
  }

  return formData;
}

export const collectionAPI = {
  create: (payload: CreateCollectionFormData) => {
    const { coverImage, ...requestData } = payload;
    const formData = buildCollectionFormData(requestData, coverImage);
    return fetchWrapper.post<CollectionResponse>("/collections", formData, true);
  },

  update: (id: string, payload: UpdateCollectionFormData) => {
    const { coverImage, ...requestData } = payload;
    const formData = buildCollectionFormData(requestData, coverImage);
    return fetchWrapper.put<CollectionResponse>(`/collections/${id}`, formData, true);
  },

  getById: (id: string) => fetchWrapper.get<CollectionResponse>(`/collections/${id}`, true),

  getByOwner: async (ownerId: string, page = 1, size = 10, pageSize?: number) => {
    const actualSize = pageSize || size;
    const res = await fetchWrapper.get<any>(
      `/collections/owner/${ownerId}?page=${page}&size=${actualSize}&pageSize=${actualSize}`,
      true
    );
    return normalizePagination<CollectionResponse>(res);
  },

  getTrending: async (page = 1, size = 10, pageSize?: number) => {
    const actualSize = pageSize || size;
    const res = await fetchWrapper.get<any>(
      `/collections/trending?page=${page}&size=${actualSize}&pageSize=${actualSize}`,
      true
    );
    return normalizePagination<CollectionResponse>(res);
  },

  getPosts: async (collectionId: string, page = 1, size = 10, pageSize?: number) => {
    const actualSize = pageSize || size;
    const res = await fetchWrapper.get<any>(
      `/collections/${collectionId}/posts?page=${page}&size=${actualSize}`,
      false
    );
    return normalizePagination<PostResponse>(res);
  },

  delete: (id: string) => fetchWrapper.del<any>(`/collections/${id}`, undefined, true),

  addPost: (collectionId: string, postId: string) =>
    fetchWrapper.post<any>(`/collections/${collectionId}/posts/${postId}`, undefined, true),

  removePost: (collectionId: string, postId: string) =>
    fetchWrapper.del<any>(`/collections/${collectionId}/posts/${postId}`, undefined, true),

  toggleReaction: (collectionId: string, type: string) =>
    fetchWrapper.post<any>(`/collections/${collectionId}/reactions?type=${type}`, undefined, true),

  getReactors: async (collectionId: string, page = 1, size = 10, pageSize?: number) => {
    const actualSize = pageSize || size;
    const res = await fetchWrapper.get<any>(
      `/collections/${collectionId}/reactors?page=${page}&size=${actualSize}`,
      true
    );
    return normalizePagination<CollectionReactionResponse>(res);
  },
};

export default collectionAPI;

