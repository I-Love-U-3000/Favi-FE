import { fetchWrapper } from "@/lib/fetchWrapper";
import { ConversationSummaryResponse, CreateGroupRequest, MessagePageResponse, 
    MessageResponse, CreateDmRequest, SendMessageRequest } from "@/types";

export const chatAPI = {
  getConversations: (page = 1, pageSize = 20) =>
    fetchWrapper.get<ConversationSummaryResponse[]>(
      `/chat/conversations?page=${page}&pageSize=${pageSize}`,
      true
    ),

  getMessages: (conversationId: string, page = 1, pageSize = 50) =>
    fetchWrapper.get<MessagePageResponse>(
      `/chat/${conversationId}/messages?page=${page}&pageSize=${pageSize}`,
      true
    ),

  sendMessage: (conversationId: string, dto: SendMessageRequest) =>
    fetchWrapper.post<MessageResponse>(
      `/chat/${conversationId}/messages`,
      dto,
      true
    ),

  getOrCreateDm: (otherProfileId: string) =>
    fetchWrapper.post<ConversationSummaryResponse>(
      `/chat/dm`,
      { otherProfileId } satisfies CreateDmRequest,
      true
    ),

  createGroup: (memberIds: string[]) =>
    fetchWrapper.post<ConversationSummaryResponse>(
      `/chat/group`,
      { memberIds } satisfies CreateGroupRequest,
      true
    ),

  markAsRead: (conversationId: string, lastMessageId: string) =>
    fetchWrapper.post<void>(
      `/chat/${conversationId}/read`,
      lastMessageId,
      true
    ),
};

export default chatAPI;
