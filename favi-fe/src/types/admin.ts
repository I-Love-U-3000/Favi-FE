// Admin Types
export type BanUserRequest = {
  Reason: string;
  BanUntilUtc?: string | null; // ISO date string or null for permanent
};

export type UnbanUserRequest = {
  Notify?: boolean;
};

export type WarnUserRequest = {
  Message: string;
};

export type AdminDeleteContentRequest = {
  Reason: string;
};

export type UserModerationResponse = {
  ProfileId: string;
  Username: string;
  DisplayName?: string | null;
  AvatarUrl?: string | null;
  IsBanned: boolean;
  BannedAt?: string | null;
  BannedUntil?: string | null;
  BanReason?: string | null;
  BannedByAdminId?: string | null;
};

export type DashboardStatsResponse = {
  UsersCount: number;
  PostsCount: number;
  CommentsCount: number;
  ReportsCount: number;
  ActiveUsersLast24h: number;
  ActiveUsersLast7d: number;
  ActiveUsersLast30d: number;
  BannedUsersCount: number;
  PostsLast24h: number;
  PostsLast7d: number;
  PostsLast30d: number;
  ReportsLast24h: number;
  ReportsLast7d: number;
  ReportsLast30d: number;
  PendingReportsCount: number;
};

export type AnalyticsUserDto = {
  ProfileId: string;
  Username: string;
  DisplayName?: string | null;
  AvatarUrl?: string | null;
  CreatedAt: string;
  LastActiveAt: string;
  PostsCount: number;
  CommentsCount: number;
  FollowersCount: number;
  FollowingCount: number;
  ReceivedLikesCount: number;
  ReceivedReportsCount: number;
  IsBanned: boolean;
  BannedAt?: string | null;
  BannedUntil?: string | null;
  Role?: string | null;
};

export type AnalyticsPostDto = {
  PostId: string;
  Caption?: string | null;
  ThumbnailUrl?: string | null;
  CreatedAt: string;
  AuthorUsername: string;
  AuthorDisplayName?: string | null;
  LikesCount: number;
  CommentsCount: number;
  ReportsCount: number;
  PrivacyLevel: number;
};
