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

export type Collection = {
  id: string;
  title: string;
  coverUrl: string;
  count: number;
};

export enum PrivacyLevel {
  Public = 0,
  Followers = 1,
  Private = 2,
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
}

export type ConversationSummaryResponse = {
  id: string;
  type: "Dm" | "Group";
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  members: ConversationMemberResponse[];
}

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
}
