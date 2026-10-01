import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  StoryResponse,
  StoryFeedResponse,
  StoryViewerResponse,
  CreateStoryRequest,
  PaginationResult,
  PrivacyLevel,
} from "@/types";

function normalizePagination<T>(res: any): PaginationResult<T> & { items: T[]; pageSize: number; totalCount: number } {
  const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []));
  const page = typeof res?.page === "number" ? res.page : 1;
  const size = typeof res?.size === "number" ? res.size : (typeof res?.pageSize === "number" ? res.pageSize : data.length);
  const hasPrevious = typeof res?.hasPrevious === "boolean" ? res.hasPrevious : page > 1;
  const hasNext = typeof res?.hasNext === "boolean" ? res.hasNext : false;
  return {
    ...res,
    data,
    items: data,
    page,
    size,
    pageSize: size,
    hasPrevious,
    hasNext,
    totalCount: typeof res?.totalCount === "number" ? res.totalCount : data.length,
  };
}

// Helper to build FormData for story creation
function buildStoryFormData(
  data: CreateStoryRequest,
  mediaFile: File
): FormData {
  const formData = new FormData();

  // Add privacy level
  formData.append("PrivacyLevel", String(data.privacyLevel));

  // Add media file
  formData.append("media", mediaFile);

  return formData;
}

export const storyAPI = {
  create: (mediaFile: File, privacyLevel: number | PrivacyLevel) => {
    const requestData: CreateStoryRequest = {
      privacyLevel: privacyLevel as PrivacyLevel,
    };
    const formData = buildStoryFormData(requestData, mediaFile);
    return fetchWrapper.post<StoryResponse>("/stories", formData, true);
  },

  getById: (id: string) =>
    fetchWrapper.get<StoryResponse>(`/stories/${id}`, false),

  getByProfile: (profileId: string) =>
    fetchWrapper.get<StoryResponse[]>(`/stories/profile/${profileId}`, false),

  getProfileStoryCount: (profileId: string) =>
    fetchWrapper.get<{ count: number }>(`/stories/profile/${profileId}/count`, false),

  getFeed: async (page = 1, size = 10, pageSize?: number) => {
    const actualSize = pageSize || size;
    const res = await fetchWrapper.get<any>(
      `/stories/feed?page=${page}&size=${actualSize}&pageSize=${actualSize}`,
      true
    );
    return normalizePagination<StoryFeedResponse>(res);
  },

  getArchived: () =>
    fetchWrapper.get<StoryResponse[]>("/stories/archived", true),

  delete: (id: string) =>
    fetchWrapper.del<any>(`/stories/${id}`, undefined, true),

  archive: (id: string) =>
    fetchWrapper.post<any>(`/stories/${id}/archive`, undefined, true),

  recordView: (id: string) =>
    fetchWrapper.post<any>(`/stories/${id}/view`, undefined, true),

  getViewers: (id: string) =>
    fetchWrapper.get<StoryViewerResponse[]>(`/stories/${id}/viewers`, true),
};

export default storyAPI;

