/**
 * Business logic layer for Notifications module.
 * Handles notification creation, push notification sending, and notification management.
 */

import {
  Result,
  Ok,
  Err,
  isOk,
  BaseError,
  NotFoundError,
  ForbiddenError,
  InternalError,
} from '@multiverse-bazaar/shared';
import { NotificationRepository, PushTokenRepository } from './repository.js';
import { CollaboratorRepository } from '../collaborators/repository.js';
import { UserRepository } from '../users/repository.js';
import { Logger } from '../../infra/logger.js';
import {
  Notification,
  NotificationType,
  NotificationData,
  NotificationListQuery,
  NotificationListResponse,
  UnreadCountResponse,
  Platform,
} from './types.js';

/**
 * Service for notification operations
 * Handles creating notifications, sending push notifications, and managing notification state
 */
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly pushTokenRepository: PushTokenRepository,
    private readonly collaboratorRepository: CollaboratorRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  /**
   * Create an in-app notification
   * Creates a notification record in the database
   *
   * @param userId - User ID to send notification to
   * @param type - Type of notification
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional structured data
   * @returns Result with created notification or BaseError
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<Result<Notification, BaseError>> {
    try {
      const createResult = await this.repository.create({
        userId,
        type,
        title,
        body,
        data,
      });

      if (!isOk(createResult)) {
        return Err(createResult.error);
      }

      this.logger.info({ userId, type, notificationId: createResult.value.id }, 'Notification created');

      return Ok(createResult.value);
    } catch (error) {
      this.logger.error({ error, userId, type }, 'Unexpected error creating notification');
      return Err(
        new InternalError('An unexpected error occurred while creating notification', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Create notification and send push notification
   * Creates an in-app notification and sends push to user's registered devices
   *
   * @param userId - User ID to notify
   * @param type - Type of notification
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional structured data
   * @returns Result with created notification or BaseError
   */
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<Result<Notification, BaseError>> {
    try {
      // Create in-app notification
      const notificationResult = await this.create(userId, type, title, body, data);
      if (!isOk(notificationResult)) {
        return Err(notificationResult.error);
      }

      // Get user's push tokens
      const tokensResult = await this.pushTokenRepository.findByUserId(userId);
      if (!isOk(tokensResult)) {
        this.logger.warn({ userId, error: tokensResult.error }, 'Failed to get push tokens for user');
        // Continue even if push tokens can't be retrieved
        return Ok(notificationResult.value);
      }

      // Send push notification if user has tokens
      if (tokensResult.value.length > 0) {
        const tokenStrings = tokensResult.value.map((t) => t.token);
        await this.sendPush(tokenStrings, { title, body, data });
      }

      return Ok(notificationResult.value);
    } catch (error) {
      this.logger.error({ error, userId, type }, 'Unexpected error sending notification');
      return Err(
        new InternalError('An unexpected error occurred while sending notification', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Notify all collaborators of a project
   * Sends notifications to all collaborators except optionally excluded user
   *
   * @param projectId - Project ID
   * @param type - Type of notification
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional structured data
   * @param excludeUserId - Optional user ID to exclude from notifications
   * @returns Result with void or BaseError
   */
  async notifyProjectCollaborators(
    projectId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: NotificationData,
    excludeUserId?: string
  ): Promise<Result<void, BaseError>> {
    try {
      // Get all collaborators for the project
      const collaboratorsResult = await this.collaboratorRepository.findByProjectId(projectId);
      if (!isOk(collaboratorsResult)) {
        return Err(collaboratorsResult.error);
      }

      const collaborators = collaboratorsResult.value;

      // Filter out excluded user if specified
      const targetCollaborators = excludeUserId
        ? collaborators.filter((c) => c.userId !== excludeUserId)
        : collaborators;

      // Send notification to each collaborator
      for (const collaborator of targetCollaborators) {
        const notifyResult = await this.notify(collaborator.userId, type, title, body, data);
        if (!isOk(notifyResult)) {
          this.logger.warn(
            { userId: collaborator.userId, projectId, error: notifyResult.error },
            'Failed to notify collaborator'
          );
          // Continue with other collaborators even if one fails
        }
      }

      this.logger.info(
        { projectId, count: targetCollaborators.length, excludeUserId },
        'Notified project collaborators'
      );

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, projectId }, 'Unexpected error notifying project collaborators');
      return Err(
        new InternalError('An unexpected error occurred while notifying project collaborators', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Notify the creator of an idea
   * Note: This is a placeholder for Phase 6 when Ideas module is implemented
   *
   * @param ideaId - Idea ID
   * @param type - Type of notification
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional structured data
   * @returns Result with void or BaseError
   */
  async notifyIdeaCreator(
    ideaId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<Result<void, BaseError>> {
    // TODO: Phase 6 - Implement when Ideas module is available
    // For now, return success as a placeholder
    this.logger.info({ ideaId, type }, 'notifyIdeaCreator called (placeholder - Ideas not yet implemented)');
    return Ok(undefined);
  }

  /**
   * Get notifications for a user with pagination
   *
   * @param userId - User ID
   * @param query - Query parameters for pagination and filtering
   * @returns Result with notification list response or BaseError
   */
  async list(userId: string, query: NotificationListQuery): Promise<Result<NotificationListResponse, BaseError>> {
    try {
      const result = await this.repository.findByUserId(userId, query);
      if (!isOk(result)) {
        return Err(result.error);
      }

      const { notifications, total } = result.value;
      const page = query.page || 1;
      const limit = query.limit || 20;
      const totalPages = Math.ceil(total / limit);

      const response: NotificationListResponse = {
        notifications,
        total,
        page,
        limit,
        totalPages,
      };

      return Ok(response);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error listing notifications');
      return Err(
        new InternalError('An unexpected error occurred while listing notifications', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Mark a notification as read
   * Verifies ownership before marking as read
   *
   * @param userId - User ID (for ownership verification)
   * @param notificationId - Notification ID
   * @returns Result with void or BaseError
   */
  async markAsRead(userId: string, notificationId: string): Promise<Result<void, BaseError>> {
    try {
      // First, verify the notification belongs to the user
      const notificationResult = await this.repository.findById(notificationId);
      if (!isOk(notificationResult)) {
        return Err(notificationResult.error);
      }

      const notification = notificationResult.value;
      if (notification.userId !== userId) {
        this.logger.warn({ userId, notificationId, ownerId: notification.userId }, 'User attempted to mark another user\'s notification as read');
        return Err(new ForbiddenError('You do not have permission to mark this notification as read'));
      }

      // Mark as read
      const markResult = await this.repository.markAsRead(notificationId);
      if (!isOk(markResult)) {
        return Err(markResult.error);
      }

      this.logger.info({ userId, notificationId }, 'Notification marked as read');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId, notificationId }, 'Unexpected error marking notification as read');
      return Err(
        new InternalError('An unexpected error occurred while marking notification as read', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Mark all notifications as read for a user
   *
   * @param userId - User ID
   * @returns Result with void or BaseError
   */
  async markAllAsRead(userId: string): Promise<Result<void, BaseError>> {
    try {
      const result = await this.repository.markAllAsRead(userId);
      if (!isOk(result)) {
        return Err(result.error);
      }

      this.logger.info({ userId, count: result.value }, 'All notifications marked as read');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error marking all notifications as read');
      return Err(
        new InternalError('An unexpected error occurred while marking all notifications as read', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get unread notification count for a user
   *
   * @param userId - User ID
   * @returns Result with unread count response or BaseError
   */
  async getUnreadCount(userId: string): Promise<Result<UnreadCountResponse, BaseError>> {
    try {
      const result = await this.repository.getUnreadCount(userId);
      if (!isOk(result)) {
        return Err(result.error);
      }

      return Ok({ count: result.value });
    } catch (error) {
      this.logger.error({ error, userId }, 'Unexpected error getting unread count');
      return Err(
        new InternalError('An unexpected error occurred while getting unread count', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Register a push token for a user
   *
   * @param userId - User ID
   * @param token - FCM token
   * @param platform - Platform (IOS or ANDROID)
   * @returns Result with void or BaseError
   */
  async registerPushToken(userId: string, token: string, platform: Platform): Promise<Result<void, BaseError>> {
    try {
      // Verify user exists
      const userResult = await this.userRepository.findById(userId);
      if (!isOk(userResult)) {
        return Err(userResult.error);
      }

      const result = await this.pushTokenRepository.register(userId, token, platform);
      if (!isOk(result)) {
        return Err(result.error);
      }

      this.logger.info({ userId, platform, tokenId: result.value.id }, 'Push token registered');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error, userId, platform }, 'Unexpected error registering push token');
      return Err(
        new InternalError('An unexpected error occurred while registering push token', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Unregister a push token
   *
   * @param token - FCM token to remove
   * @returns Result with void or BaseError
   */
  async unregisterPushToken(token: string): Promise<Result<void, BaseError>> {
    try {
      const result = await this.pushTokenRepository.delete(token);
      if (!isOk(result)) {
        return Err(result.error);
      }

      this.logger.info({ token: token.substring(0, 20) + '...' }, 'Push token unregistered');

      return Ok(undefined);
    } catch (error) {
      this.logger.error({ error }, 'Unexpected error unregistering push token');
      return Err(
        new InternalError('An unexpected error occurred while unregistering push token', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Send push notification via Firebase Cloud Messaging
   * PLACEHOLDER: This will be implemented when FCM is configured
   *
   * @param tokens - Array of FCM tokens
   * @param notification - Notification payload
   * @returns Promise<void>
   */
  private async sendPush(
    tokens: string[],
    notification: { title: string; body: string; data?: object }
  ): Promise<void> {
    // TODO: Implement actual FCM sending using firebase-admin
    // For now, just log the notification
    this.logger.info(
      {
        tokens: tokens.length,
        notification: {
          title: notification.title,
          body: notification.body,
          hasData: !!notification.data,
        },
      },
      'Push notification would be sent'
    );

    // Example of how FCM integration would work:
    // import * as admin from 'firebase-admin';
    //
    // const message = {
    //   notification: {
    //     title: notification.title,
    //     body: notification.body,
    //   },
    //   data: notification.data ? JSON.parse(JSON.stringify(notification.data)) : undefined,
    //   tokens: tokens,
    // };
    //
    // try {
    //   const response = await admin.messaging().sendMulticast(message);
    //   this.logger.info(
    //     { successCount: response.successCount, failureCount: response.failureCount },
    //     'FCM push notification sent'
    //   );
    // } catch (error) {
    //   this.logger.error({ error }, 'Failed to send FCM push notification');
    //   throw error;
    // }
  }
}
