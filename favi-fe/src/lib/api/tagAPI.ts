import { fetchWrapper } from "@/lib/fetchWrapper";

export const tagAPI = {
  getPaged: (page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/tags?page=${page}&pageSize=${pageSize}`, false),

  getById: (id: string) => fetchWrapper.get<any>(`/tags/${id}`, false),

  getPosts: (id: string, page = 1, pageSize = 20) =>
    fetchWrapper.get<any>(`/tags/${id}/posts?page=${page}&pageSize=${pageSize}`, false),
};

export default tagAPI;
