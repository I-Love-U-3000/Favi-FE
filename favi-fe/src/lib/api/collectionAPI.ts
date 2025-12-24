import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CollectionResponse,
  CreateCollectionFormData,
  UpdateCollectionFormData,
} from "@/types";

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

  getById: (id: string) => fetchWrapper.get<CollectionResponse>(`/collections/${id}`, false),

  getByOwner: (ownerId: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<{ items: CollectionResponse[]; page: number; pageSize: number; totalCount: number }>(
      `/collections/owner/${ownerId}?page=${page}&pageSize=${pageSize}`, false
    ),

  getTrending: (page = 1, pageSize = 20) =>
    fetchWrapper.get<{ items: CollectionResponse[]; page: number; pageSize: number; totalCount: number }>(
      `/collections/trending?page=${page}&pageSize=${pageSize}`, false
    ),

  getPosts: (collectionId: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<{ items: any[]; page: number; pageSize: number; totalCount: number }>(
      `/collections/${collectionId}/posts?page=${page}&pageSize=${pageSize}`, false
    ),

  delete: (id: string) => fetchWrapper.del<any>(`/collections/${id}`, undefined, true),

  addPost: (collectionId: string, postId: string) =>
    fetchWrapper.post<any>(`/collections/${collectionId}/posts/${postId}`, undefined, true),

  removePost: (collectionId: string, postId: string) =>
    fetchWrapper.del<any>(`/collections/${collectionId}/posts/${postId}`, undefined, true),

  toggleReaction: (collectionId: string, type: string) =>
    fetchWrapper.post<any>(`/collections/${collectionId}/reactions?type=${type}`, undefined, true),
};

export default collectionAPI;
