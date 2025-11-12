import { fetchWrapper } from "@/lib/fetchWrapper";

export const searchAPI = {
  search: (payload: {
    keyword: string;
    filters?: Record<string, any>;
    page?: number;
    pageSize?: number;
  }) => fetchWrapper.post<any>("/search", payload, false),
};

export default searchAPI;
