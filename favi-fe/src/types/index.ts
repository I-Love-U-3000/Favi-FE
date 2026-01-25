export type LoginRequest = {
  identifier: string;
  password: string;
  remember: boolean;
};

export type LoginResponse = { 
  accessToken: string; 
  refreshToken: string 
};

export type RegisterRequest = {
  identifier: string;
  email: string;
  username: string; 
  password: string;
};

export type DecodedJwt = {
  sub?: string;
  exp?: number;           
  iat?: number;           
  nbf?: number;           
  email?: string;
  role?: string | string[];
  [key: string]: any;     
};

export type ProfileUpdateInput = {
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
};

// Backend profile DTO (C# ProfileResponse)
export type ProfileResponse = {
  id: string; // Guid
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  createdAt: string; // ISO
  lastActiveAt: string; // ISO
  privacyLevel: PrivacyLevel;
  followPrivacyLevel: PrivacyLevel;
  followersCount?: number | null;
  followingCount?: number | null;
};

export type UserProfile = {
  id: string;
  username: string;         
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  website?: string | null;
  location?: string | null;
  stats: {
    posts: number;
    followers: number;
    following: number;
    likes?: number;
  };
  isMe?: boolean;           
  isFollowing?: boolean;    
  joinedAtISO?: string;    
};

export type SocialKind =
  | "Website"
  | "Facebook"
  | "Instagram"
  | "Twitter"
  | "Tiktok"
  | "Youtube"
  | "Github"
  | "LinkedIn";

export type SocialLink = {
  id?: string;
  socialKind: SocialKind | "Website";
  url: string;
};

export type PhotoPost = {
  id: string;
  imageUrl: string;
  alt?: string;
  width: number;
  height: number;
  createdAtISO: string;
  likeCount: number;
  commentCount: number;
  tags?: string[];
};

// Backend collection DTOs (C# CreateCollectionRequest, UpdateCollectionRequest, CollectionResponse)
// Note: coverImage file is sent separately as FormData
export type CreateCollectionRequest = {
  title: string;
  description?: string | null;
  privacyLevel: PrivacyLevel;
};

export type UpdateCollectionRequest = {
  title?: string | null;
  description?: string | null;
  privacyLevel?: PrivacyLevel;
};

// For FormData with cover image upload
export type CreateCollectionFormData = CreateCollectionRequest & {
  coverImage?: File | null;
};

export type UpdateCollectionFormData = UpdateCollectionRequest & {
  coverImage?: File | null;
};

export type CollectionResponse = {
  id: string; // Guid
  ownerProfileId: string; // Guid
  title: string;
  description?: string | null;
  coverImageUrl: string;
  privacyLevel: PrivacyLevel;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  postIds: string[]; // Guid[]
  postCount: number;
  reactions?: ReactionSummaryDto;
};

export type Collection = {
  id: string;
  title: string;
  coverUrl: string;
  count: number;
};

export enum PrivacyLevel {
  Public = "Public",
  Followers = "Followers",
  Private = "Private",
}

export type ReactionType =
  | "Like"
  | "Love"
  | "Haha"
  | "Wow"
  | "Sad"
  | "Angry";

export type LocationDto = {
  name?: string | null;
  fullAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type CreatePostRequest = {
  caption?: string | null;
  tags?: string[] | null;
  privacyLevel: PrivacyLevel;
  location?: LocationDto | null;
};

export type UpdatePostRequest = {
  caption?: string | null;
};

export type TagDto = {
  id: string; // Guid
  name: string;
};

export type PostMediaResponse = {
  id: string; // Guid
  postId: string; // Guid
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  position: number;
  thumbnailUrl?: string | null;
};

export type ReactionSummaryDto = {
  total: number;
  byType: Record<ReactionType, number>;
  currentUserReaction?: ReactionType | null;
};

export type PostResponse = {
  id: string; // Guid
  authorProfileId: string; // Guid
  caption?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  privacyLevel: PrivacyLevel;
  medias: PostMediaResponse[];
  tags: TagDto[];
  reactions: ReactionSummaryDto;
  commentsCount: number;
  location?: LocationDto | null;
  isNSFW?: boolean;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type CreateCommentRequest = {
  postId: string;
  authorProfileId?: string | null;
  content: string;
  mediaUrl?: string | null;
  parentCommentId?: string | null;
};

export type UpdateCommentRequest = {
  content: string;
};

export type CommentResponse = {
  id: string; // Guid
  postId: string; // Guid
  authorProfileId?: string | null;
  authorUsername?: string | null;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
  content: string;
  mediaUrl?: string | null;
  createdAt: string; // ISO
  updatedAt?: string | null; // ISO
  parentCommentId?: string | null;
  reactions?: ReactionSummaryDto | null;
};

export type CommentTreeResponse = CommentResponse & {
  replies?: CommentTreeResponse[];
};

export type ConversationMemberResponse = {
  profileId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  lastActiveAt?: string;
}

export type ConversationSummaryResponse = {
  id: string;
  type: "Dm" | "Group";
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  members: ConversationMemberResponse[];
}

export type PostPreviewDto = {
  id: string;
  authorProfileId: string;
  caption?: string | null;
  thumbnailUrl?: string | null;
  mediasCount: number;
  createdAt: string;
};

export type MessageResponse = {
  id: string;
  conversationId: string;
  senderId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  content?: string;
  mediaUrl?: string;
  createdAt: string;
  updatedAt?: string | null;
  isEdited: boolean;
  readBy: string[]; // Array of profile IDs who have read this message
  postPreview?: PostPreviewDto | null;
}

export type MessagePageResponse = {
  items: MessageResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export type CreateDmRequest = {
  otherProfileId: string;
}

export type CreateGroupRequest = {
  memberIds: string[];
}

export type SendMessageRequest = {
  content?: string;
  mediaUrl?: string;
  postId?: string;
}

export type FollowResponse = {
  followerId: string;
  followeeId: string;
  createdAt: string;
};

// Search types
export type SearchRequest = {
  query: string;
  page: number;
  pageSize: number;
};

export type SearchPostDto = {
  id: string; // Guid
  caption: string;
  thumbnailUrl: string;
};

export type SearchTagDto = {
  id: string; // Guid
  name: string;
  postCount: number;
};

export type SearchResult = {
  posts: SearchPostDto[];
  tags: SearchTagDto[];
};

export type SemanticSearchRequest = {
  query: string;
  page?: number;
  pageSize?: number;
  k?: number;
};

// Notification types
export enum NotificationType {
  Like = 0,
  Comment = 1,
  Follow = 2,
  System = 3
}

// Helper to convert numeric type to enum
export function notificationTypeToString(type: number | NotificationType): string {
  switch (type) {
    case 0:
    case NotificationType.Like:
      return 'Like';
    case 1:
    case NotificationType.Comment:
      return 'Comment';
    case 2:
    case NotificationType.Follow:
      return 'Follow';
    case 3:
    case NotificationType.System:
      return 'System';
    default:
      return 'Like';
  }
}

export type NotificationDto = {
  id: string;
  type: number | NotificationType;
  actorProfileId: string;
  actorUsername: string;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  targetPostId: string | null;
  targetCommentId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

// Report types
export enum ReportTarget {
  User = 0,
  Post = 1,
  Comment = 2,
  Message = 3,
  Collection = 4,
}

export enum ReportStatus {
  Pending = 0,
  Reviewed = 1,
  Resolved = 2,
  Rejected = 3,
}

export type CreateReportRequest = {
  reporterProfileId: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
};

export type UpdateReportStatusRequest = {
  newStatus: ReportStatus;
};

export type ReportResponse = {
  id: string;
  reporterProfileId: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  actedAt?: string | null;
  data?: string | null;
};

// Story types
export type CreateStoryRequest = {
  privacyLevel: PrivacyLevel;
};

export type StoryResponse = {
  id: string;
  profileId: string;
  profileUsername: string;
  profileAvatarUrl: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  createdAt: string;
  expiresAt: string;
  privacy: PrivacyLevel;
  isArchived: boolean;
  isNSFW?: boolean;
  viewCount: number;
  hasViewed: boolean;
};

export type StoryFeedResponse = {
  profileId: string;
  profileUsername: string;
  profileAvatarUrl: string | null;
  stories: StoryResponse[];
};

export type StoryViewerResponse = {
  viewerId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  viewedAt: string;
};

export type PostReactionResponse = {
  profileId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reactionType: ReactionType;
  createdAt: string;
};

export type CollectionReactionResponse = {
  profileId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reactionType: ReactionType;
  createdAt: string;
};

export type CommentReactionResponse = {  profileId: string;  username: string;  displayName: string | null;  avatarUrl: string | null;  reactionType: ReactionType;  createdAt: string;};
// Repost/Share types
export type CreateRepostRequest = {
  caption?: string | null;
};

export enum FeedItemType {
  Post = 0,
  Repost = 1,
}

export type FeedItemDto = {
  type: FeedItemType;
  post?: PostResponse | null;
  repost?: RepostResponse | null;
  createdAt: string;  // For sorting
};

export type RepostResponse = {
  id: string;
  profileId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  originalPostId: string;
  originalCaption?: string | null;
  originalAuthorProfileId: string;
  originalAuthorUsername: string;
  originalAuthorDisplayName?: string | null;
  originalAuthorAvatarUrl?: string | null;
  originalPostMedias: PostMediaResponse[];
  caption?: string | null;
  createdAt: string;
  updatedAt: string;
  commentsCount: number;  // Comments on this repost (separate from original post)
  reactions: ReactionSummaryDto;  // Reactions on this repost (separate from original post)
  repostsCount: number;  // Total reposts of the original post
  isRepostedByCurrentUser: boolean;
};
