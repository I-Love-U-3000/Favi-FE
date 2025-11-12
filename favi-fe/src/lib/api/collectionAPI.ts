import { fetchWrapper } from "@/lib/fetchWrapper";

export const collectionAPI = {
  create: (payload: { name: string; description?: string; isPrivate?: boolean }) =>
    fetchWrapper.post<any>("/collections", payload, true),

  update: (id: string, payload: { name?: string; description?: string; isPrivate?: boolean }) =>
    fetchWrapper.put<any>(`/collections/${id}`, payload, true),

  getById: (id: string) => fetchWrapper.get<any>(`/collections/${id}`, false),

  getByOwner: (ownerId: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/collections/owner/${ownerId}?page=${page}&pageSize=${pageSize}`, false),

  getPosts: (collectionId: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/collections/${collectionId}/posts?page=${page}&pageSize=${pageSize}`, false),

  delete: (id: string) => fetchWrapper.del<any>(`/collections/${id}`, undefined, true),

  addPost: (collectionId: string, postId: string) =>
    fetchWrapper.post<any>(`/collections/${collectionId}/posts/${postId}`, undefined, true),

  removePost: (collectionId: string, postId: string) =>
    fetchWrapper.del<any>(`/collections/${collectionId}/posts/${postId}`, undefined, true),
};

export default collectionAPI;
