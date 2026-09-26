import { fetchWrapper } from "@/lib/fetchWrapper";
import type {
  ConversationSummaryResponse,
  CreateGroupRequest,
  MessagePageResponse,
  MessageResponse,
  CreateDmRequest,
  SendMessageRequest,
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

export const chatAPI = {
  getConversations: async (page = 1, size = 10, pageSize?: number) => {
    const actualSize = pageSize || size;
    const res = await fetchWrapper.get<any>(
      `/chat/conversations?page=${page}&size=${actualSize}&pageSize=${actualSize}`,
      true
    );
    return normalizePagination<ConversationSummaryResponse>(res);
  },

  getMessages: async (conversationId: string, page = 1, size = 50, pageSize?: number) => {
    const actualSize = pageSize || size;
    const res = await fetchWrapper.get<any>(
      `/chat/${conversationId}/messages?page=${page}&size=${actualSize}&pageSize=${actualSize}`,
      true
    );
    return normalizePagination<MessageResponse>(res);
  },

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

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchWrapper.post<{ url: string; publicId: string; width: number; height: number; format: string }>(
      "/chat/upload-image",
      formData,
      true
    );
  },
};

export default chatAPI;
