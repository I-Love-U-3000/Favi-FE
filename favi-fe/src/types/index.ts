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