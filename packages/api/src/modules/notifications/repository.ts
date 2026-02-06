/**
 * Data access layer for Notifications module.
 * Handles all database operations related to notifications and push tokens.
 */

import { PrismaClient } from '@prisma/client';
import { Result, Ok, Err, InternalError, NotFoundError } from '@multiverse-bazaar/shared';
import {
  Notification,
  NotificationType,
  CreateNotificationRequest,
  NotificationListQuery,
  PushToken,
  Platform,
} from './types.js';

/**
 * Repository for notification-related database operations
 */
export class NotificationRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new notification
   * @param data - Notification creation data
   * @returns Result with created notification or InternalError
   */
  async create(data: CreateNotificationRequest): Promise<Result<Notification, InternalError>> {
    try {
      const notification = await this.db.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data ? JSON.stringify(data.data) : null,
          read: false,
        },
      });

      const mapped: Notification = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationType,
        title: notification.title,
        body: notification.body,
        data: notification.data ? JSON.parse(notification.data as string) : undefined,
        read: notification.read,
        createdAt: notification.createdAt,
      };

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to create notification', {
          userId: data.userId,
          type: data.type,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find a notification by ID
   * @param id - Notification ID
   * @returns Result with notification or NotFoundError
   */
  async findById(id: string): Promise<Result<Notification, NotFoundError | InternalError>> {
    try {
      const notification = await this.db.notification.findUnique({
        where: { id },
      });

      if (!notification) {
        return Err(new NotFoundError('Notification'));
      }

      const mapped: Notification = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as NotificationType,
        title: notification.title,
        body: notification.body,
        data: notification.data ? JSON.parse(notification.data as string) : undefined,
        read: notification.read,
        createdAt: notification.createdAt,
      };

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to find notification by ID', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find notifications for a user with pagination
   * @param userId - User ID
   * @param query - Query parameters for pagination and filtering
   * @returns Result with array of notifications or InternalError
   */
  async findByUserId(
    userId: string,
    query: NotificationListQuery
  ): Promise<Result<{ notifications: Notification[]; total: number }, InternalError>> {
    try {
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = (page - 1) * limit;

      const where = {
        userId,
        ...(query.unreadOnly ? { read: false } : {}),
      };

      const [notifications, total] = await Promise.all([
        this.db.notification.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        this.db.notification.count({ where }),
      ]);

      const mapped: Notification[] = notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        type: n.type as NotificationType,
        title: n.title,
        body: n.body,
        data: n.data ? JSON.parse(n.data as string) : undefined,
        read: n.read,
        createdAt: n.createdAt,
      }));

      return Ok({ notifications: mapped, total });
    } catch (error) {
      return Err(
        new InternalError('Failed to find notifications for user', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Mark a notification as read
   * @param id - Notification ID
   * @returns Result with void or error
   */
  async markAsRead(id: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.notification.update({
        where: { id },
        data: { read: true },
      });

      return Ok(undefined);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return Err(new NotFoundError('Notification'));
      }

      return Err(
        new InternalError('Failed to mark notification as read', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId - User ID
   * @returns Result with count of updated notifications or InternalError
   */
  async markAllAsRead(userId: string): Promise<Result<number, InternalError>> {
    try {
      const result = await this.db.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return Ok(result.count);
    } catch (error) {
      return Err(
        new InternalError('Failed to mark all notifications as read', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Get unread notification count for a user
   * @param userId - User ID
   * @returns Result with unread count or InternalError
   */
  async getUnreadCount(userId: string): Promise<Result<number, InternalError>> {
    try {
      const count = await this.db.notification.count({
        where: {
          userId,
          read: false,
        },
      });

      return Ok(count);
    } catch (error) {
      return Err(
        new InternalError('Failed to get unread notification count', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete a notification
   * @param id - Notification ID
   * @returns Result with void or error
   */
  async delete(id: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.notification.delete({
        where: { id },
      });

      return Ok(undefined);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return Err(new NotFoundError('Notification'));
      }

      return Err(
        new InternalError('Failed to delete notification', {
          id,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete old notifications
   * Cleanup job to remove notifications older than a specified date
   * @param olderThan - Date threshold
   * @returns Result with count of deleted notifications or InternalError
   */
  async deleteOld(olderThan: Date): Promise<Result<number, InternalError>> {
    try {
      const result = await this.db.notification.deleteMany({
        where: {
          createdAt: {
            lt: olderThan,
          },
        },
      });

      return Ok(result.count);
    } catch (error) {
      return Err(
        new InternalError('Failed to delete old notifications', {
          olderThan: olderThan.toISOString(),
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}

/**
 * Repository for push token-related database operations
 */
export class PushTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Register or update a push token for a user
   * @param userId - User ID
   * @param token - FCM token
   * @param platform - Platform (IOS or ANDROID)
   * @returns Result with push token or InternalError
   */
  async register(userId: string, token: string, platform: Platform): Promise<Result<PushToken, InternalError>> {
    try {
      const pushToken = await this.db.pushToken.upsert({
        where: {
          token,
        },
        update: {
          userId,
          platform,
          lastUsedAt: new Date(),
        },
        create: {
          userId,
          token,
          platform,
          lastUsedAt: new Date(),
        },
      });

      const mapped: PushToken = {
        id: pushToken.id,
        userId: pushToken.userId,
        token: pushToken.token,
        platform: pushToken.platform as Platform,
        lastUsedAt: pushToken.lastUsedAt,
        createdAt: pushToken.createdAt,
      };

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to register push token', {
          userId,
          platform,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find all push tokens for a user
   * @param userId - User ID
   * @returns Result with array of push tokens or InternalError
   */
  async findByUserId(userId: string): Promise<Result<PushToken[], InternalError>> {
    try {
      const tokens = await this.db.pushToken.findMany({
        where: { userId },
        orderBy: {
          lastUsedAt: 'desc',
        },
      });

      const mapped: PushToken[] = tokens.map((t) => ({
        id: t.id,
        userId: t.userId,
        token: t.token,
        platform: t.platform as Platform,
        lastUsedAt: t.lastUsedAt,
        createdAt: t.createdAt,
      }));

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to find push tokens for user', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Find a push token by token string
   * @param token - FCM token
   * @returns Result with push token or NotFoundError
   */
  async findByToken(token: string): Promise<Result<PushToken, NotFoundError | InternalError>> {
    try {
      const pushToken = await this.db.pushToken.findUnique({
        where: { token },
      });

      if (!pushToken) {
        return Err(new NotFoundError('Push token'));
      }

      const mapped: PushToken = {
        id: pushToken.id,
        userId: pushToken.userId,
        token: pushToken.token,
        platform: pushToken.platform as Platform,
        lastUsedAt: pushToken.lastUsedAt,
        createdAt: pushToken.createdAt,
      };

      return Ok(mapped);
    } catch (error) {
      return Err(
        new InternalError('Failed to find push token', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete a push token
   * @param token - FCM token
   * @returns Result with void or error
   */
  async delete(token: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.pushToken.delete({
        where: { token },
      });

      return Ok(undefined);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return Err(new NotFoundError('Push token'));
      }

      return Err(
        new InternalError('Failed to delete push token', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Update the last used timestamp for a token
   * @param token - FCM token
   * @returns Result with void or error
   */
  async updateLastUsed(token: string): Promise<Result<void, NotFoundError | InternalError>> {
    try {
      await this.db.pushToken.update({
        where: { token },
        data: {
          lastUsedAt: new Date(),
        },
      });

      return Ok(undefined);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return Err(new NotFoundError('Push token'));
      }

      return Err(
        new InternalError('Failed to update push token last used timestamp', {
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }

  /**
   * Delete inactive push tokens
   * Cleanup job to remove tokens that haven't been used in a while
   * @param olderThan - Date threshold
   * @returns Result with count of deleted tokens or InternalError
   */
  async deleteInactive(olderThan: Date): Promise<Result<number, InternalError>> {
    try {
      const result = await this.db.pushToken.deleteMany({
        where: {
          lastUsedAt: {
            lt: olderThan,
          },
        },
      });

      return Ok(result.count);
    } catch (error) {
      return Err(
        new InternalError('Failed to delete inactive push tokens', {
          olderThan: olderThan.toISOString(),
          error: error instanceof Error ? error.message : String(error),
        })
      );
    }
  }
}
