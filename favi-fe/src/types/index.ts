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
}

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
  interests?: string[];
}

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

// ============
// Post DTOs (align with backend)
// ============

// Use a numeric alias for PrivacyLevel to match typical .NET enum JSON (number)
export type PrivacyLevel = number;

export type ReactionType =
  | "Like"
  | "Love"
  | "Haha"
  | "Wow"
  | "Sad"
  | "Angry";

export type CreatePostRequest = {
  caption?: string | null;
  tags?: string[] | null;
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
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};
