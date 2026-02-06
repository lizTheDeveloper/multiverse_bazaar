/**
 * Type definitions for the Notifications module.
 * Defines request/response types and internal types for notification operations.
 */

/**
 * Notification type enumeration
 * Defines the types of notifications that can be sent to users
 */
export enum NotificationType {
  UPVOTE = 'UPVOTE',
  COLLABORATION_INVITE = 'COLLABORATION_INVITE',
  IDEA_INTEREST = 'IDEA_INTEREST',
}

/**
 * Platform enumeration for push notifications
 * Specifies the mobile platform for FCM tokens
 */
export enum Platform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
}

/**
 * Notification data for UPVOTE type
 * Contains information about who upvoted which project
 */
export interface UpvoteNotificationData {
  projectId: string;
  projectTitle: string;
  upvoterId: string;
  upvoterName: string;
}

/**
 * Notification data for COLLABORATION_INVITE type
 * Contains information about a collaboration invitation
 */
export interface CollaborationInviteNotificationData {
  projectId: string;
  projectTitle: string;
  inviterId: string;
  inviterName: string;
  role: string;
}

/**
 * Notification data for IDEA_INTEREST type
 * Contains information about interest expressed in an idea
 */
export interface IdeaInterestNotificationData {
  ideaId: string;
  ideaTitle: string;
  interestedUserId: string;
  interestedUserName: string;
  message?: string;
}

/**
 * Union type for all notification data types
 * Provides type-safe access to notification data based on type
 */
export type NotificationData =
  | UpvoteNotificationData
  | CollaborationInviteNotificationData
  | IdeaInterestNotificationData;

/**
 * Notification entity representing an in-app notification
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
  read: boolean;
  createdAt: Date;
}

/**
 * Request payload for creating a notification
 */
export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}

/**
 * Push token entity representing a registered FCM token
 */
export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: Platform;
  lastUsedAt: Date;
  createdAt: Date;
}

/**
 * Request payload for registering a push token
 */
export interface RegisterPushTokenRequest {
  token: string;
  platform: Platform;
}

/**
 * Query parameters for listing notifications
 */
export interface NotificationListQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

/**
 * Response for notification list with pagination
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Response for unread count
 */
export interface UnreadCountResponse {
  count: number;
}
