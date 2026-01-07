import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  StoryResponse,
  StoryFeedResponse,
  StoryViewerResponse,
  CreateStoryRequest,
} from "@/types";

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
  create: (mediaFile: File, privacyLevel: number) => {
    const requestData: CreateStoryRequest = {
      privacyLevel,
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

  getFeed: () =>
    fetchWrapper.get<StoryFeedResponse[]>("/stories/feed", true),

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
