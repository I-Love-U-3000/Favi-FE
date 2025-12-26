// Mock data for admin pages

import type {
  DashboardStatsResponse,
  AnalyticsUserDto,
  AnalyticsPostDto,
  ReportResponse,
} from "@/types";

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStatsResponse = {
  UsersCount: 1234,
  PostsCount: 5678,
  CommentsCount: 12345,
  ReportsCount: 89,
  ActiveUsersLast24h: 45,
  ActiveUsersLast7d: 234,
  ActiveUsersLast30d: 567,
  BannedUsersCount: 12,
  PostsLast24h: 34,
  PostsLast7d: 234,
  PostsLast30d: 678,
  ReportsLast24h: 5,
  ReportsLast7d: 23,
  ReportsLast30d: 67,
  PendingReportsCount: 8,
};

// Mock Users List
export const mockUsers: AnalyticsUserDto[] = [
  {
    ProfileId: "user-001",
    Username: "johndoe",
    DisplayName: "John Doe",
    AvatarUrl: "https://i.pravatar.cc/150?u=johndoe",
    CreatedAt: "2024-01-15T10:30:00Z",
    LastActiveAt: "2024-12-26T08:45:00Z",
    PostsCount: 42,
    CommentsCount: 156,
    FollowersCount: 89,
    FollowingCount: 45,
    ReceivedLikesCount: 234,
    ReceivedReportsCount: 0,
    IsBanned: false,
    BannedAt: null,
    BannedUntil: null,
    Role: "user",
  },
  {
    ProfileId: "user-002",
    Username: "janedoe",
    DisplayName: "Jane Doe",
    AvatarUrl: "https://i.pravatar.cc/150?u=janedoe",
    CreatedAt: "2024-02-20T14:20:00Z",
    LastActiveAt: "2024-12-26T09:15:00Z",
    PostsCount: 78,
    CommentsCount: 234,
    FollowersCount: 156,
    FollowingCount: 67,
    ReceivedLikesCount: 567,
    ReceivedReportsCount: 1,
    IsBanned: false,
    BannedAt: null,
    BannedUntil: null,
    Role: "user",
  },
  {
    ProfileId: "user-003",
    Username: "spammer123",
    DisplayName: "Spam Account",
    AvatarUrl: "https://i.pravatar.cc/150?u=spammer",
    CreatedAt: "2024-11-01T08:00:00Z",
    LastActiveAt: "2024-12-20T12:30:00Z",
    PostsCount: 234,
    CommentsCount: 567,
    FollowersCount: 12,
    FollowingCount: 3,
    ReceivedLikesCount: 45,
    ReceivedReportsCount: 15,
    IsBanned: true,
    BannedAt: "2024-12-22T10:00:00Z",
    BannedUntil: "2025-01-22T10:00:00Z",
    Role: "user",
  },
  {
    ProfileId: "user-004",
    Username: "mike_wilson",
    DisplayName: "Mike Wilson",
    AvatarUrl: "https://i.pravatar.cc/150?u=mike",
    CreatedAt: "2024-03-10T16:45:00Z",
    LastActiveAt: "2024-12-25T20:00:00Z",
    PostsCount: 123,
    CommentsCount: 345,
    FollowersCount: 234,
    FollowingCount: 89,
    ReceivedLikesCount: 890,
    ReceivedReportsCount: 0,
    IsBanned: false,
    BannedAt: null,
    BannedUntil: null,
    Role: "user",
  },
  {
    ProfileId: "user-005",
    Username: "sarah_smith",
    DisplayName: "Sarah Smith",
    AvatarUrl: "https://i.pravatar.cc/150?u=sarah",
    CreatedAt: "2024-04-05T11:30:00Z",
    LastActiveAt: "2024-12-26T07:30:00Z",
    PostsCount: 67,
    CommentsCount: 189,
    FollowersCount: 345,
    FollowingCount: 123,
    ReceivedLikesCount: 456,
    ReceivedReportsCount: 2,
    IsBanned: false,
    BannedAt: null,
    BannedUntil: null,
    Role: "user",
  },
];

// Mock Posts List
export const mockPosts: AnalyticsPostDto[] = [
  {
    PostId: "post-001",
    Caption: "Beautiful sunset at the beach today! 🌅",
    ThumbnailUrl: "https://picsum.photos/200/200?random=1",
    CreatedAt: "2024-12-26T05:30:00Z",
    AuthorUsername: "johndoe",
    AuthorDisplayName: "John Doe",
    LikesCount: 234,
    CommentsCount: 45,
    ReportsCount: 0,
    PrivacyLevel: 0, // Public
  },
  {
    PostId: "post-002",
    Caption: "My new artwork! What do you think? 🎨",
    ThumbnailUrl: "https://picsum.photos/200/200?random=2",
    CreatedAt: "2024-12-25T14:20:00Z",
    AuthorUsername: "janedoe",
    AuthorDisplayName: "Jane Doe",
    LikesCount: 567,
    CommentsCount: 89,
    ReportsCount: 0,
    PrivacyLevel: 0,
  },
  {
    PostId: "post-003",
    Caption: "Click here for free iPhone!!! 🎁",
    ThumbnailUrl: "https://picsum.photos/200/200?random=3",
    CreatedAt: "2024-12-20T10:00:00Z",
    AuthorUsername: "spammer123",
    AuthorDisplayName: "Spam Account",
    LikesCount: 12,
    CommentsCount: 3,
    ReportsCount: 8,
    PrivacyLevel: 0,
  },
  {
    PostId: "post-004",
    Caption: "Private collection for my close friends only",
    ThumbnailUrl: "https://picsum.photos/200/200?random=4",
    CreatedAt: "2024-12-24T16:45:00Z",
    AuthorUsername: "mike_wilson",
    AuthorDisplayName: "Mike Wilson",
    LikesCount: 89,
    CommentsCount: 23,
    ReportsCount: 0,
    PrivacyLevel: 2, // Followers Only
  },
  {
    PostId: "post-005",
    Caption: "Morning coffee vibes ☕",
    ThumbnailUrl: "https://picsum.photos/200/200?random=5",
    CreatedAt: "2024-12-26T08:00:00Z",
    AuthorUsername: "sarah_smith",
    AuthorDisplayName: "Sarah Smith",
    LikesCount: 345,
    CommentsCount: 67,
    ReportsCount: 0,
    PrivacyLevel: 1, // Private
  },
];

// Mock Reports
import { ReportStatus, ReportTarget } from "@/types";

export const mockReports: ReportResponse[] = [
  {
    id: "report-001",
    reporterProfileId: "user-002",
    targetId: "post-003",
    targetType: ReportTarget.Post,
    reason: "Spam content - fake giveaway",
    status: ReportStatus.Pending,
    createdAt: "2024-12-26T06:00:00Z",
    updatedAt: "2024-12-26T06:00:00Z",
  },
  {
    id: "report-002",
    reporterProfileId: "user-004",
    targetId: "user-003",
    targetType: ReportTarget.User,
    reason: "This user is posting spam and scam content",
    status: ReportStatus.Pending,
    createdAt: "2024-12-25T14:30:00Z",
    updatedAt: "2024-12-25T14:30:00Z",
  },
  {
    id: "report-003",
    reporterProfileId: "user-005",
    targetId: "post-002",
    targetType: ReportTarget.Post,
    reason: "Inappropriate content",
    status: ReportStatus.Reviewed,
    createdAt: "2024-12-24T10:15:00Z",
    updatedAt: "2024-12-25T09:00:00Z",
  },
  {
    id: "report-004",
    reporterProfileId: "user-001",
    targetId: "user-003",
    targetType: ReportTarget.User,
    reason: "Harassment and abusive behavior",
    status: ReportStatus.Resolved,
    createdAt: "2024-12-22T16:45:00Z",
    updatedAt: "2024-12-23T11:20:00Z",
  },
  {
    id: "report-005",
    reporterProfileId: "user-002",
    targetId: "post-001",
    targetType: ReportTarget.Post,
    reason: "Copyright violation",
    status: ReportStatus.Rejected,
    createdAt: "2024-12-20T08:30:00Z",
    updatedAt: "2024-12-21T14:00:00Z",
  },
];

// Helper function to create paged results
export function createPagedResult<T>(
  items: T[],
  page: number,
  pageSize: number
) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    totalCount: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
    hasNextPage: endIndex < items.length,
    hasPreviousPage: page > 1,
  };
}
