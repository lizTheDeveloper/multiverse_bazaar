/**
 * Notifications module entry point.
 * Exports public API for use by other parts of the application.
 */

// Export types
export type {
  Notification,
  NotificationData,
  UpvoteNotificationData,
  CollaborationInviteNotificationData,
  IdeaInterestNotificationData,
  CreateNotificationRequest,
  PushToken,
  RegisterPushTokenRequest,
  NotificationListQuery,
  NotificationListResponse,
  UnreadCountResponse,
} from './types.js';

export { NotificationType, Platform } from './types.js';

// Export schemas
export {
  registerPushTokenSchema,
  notificationListQuerySchema,
  notificationIdParamSchema,
  deletePushTokenSchema,
} from './schemas.js';

export type {
  ValidatedRegisterPushToken,
  ValidatedNotificationListQuery,
  ValidatedNotificationIdParam,
  ValidatedDeletePushToken,
} from './schemas.js';

// Export service
export { NotificationService } from './service.js';

// Export repositories
export { NotificationRepository, PushTokenRepository } from './repository.js';

// Export routes factory
export { createNotificationRoutes } from './routes.js';
