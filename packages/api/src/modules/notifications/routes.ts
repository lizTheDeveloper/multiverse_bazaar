/**
 * Notification routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for notification management and push token registration.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { NotificationService } from './service.js';
import {
  registerPushTokenSchema,
  notificationListQuerySchema,
  notificationIdParamSchema,
  deletePushTokenSchema,
} from './schemas.js';
import { authMiddleware } from '../auth/middleware.js';
import { AuthService } from '../auth/service.js';
import { Logger } from '../../infra/logger.js';

/**
 * Context variables available in notification routes
 */
interface NotificationContext {
  Variables: {
    requestId: string;
    logger: Logger;
    user?: {
      id: string;
      email: string;
      name: string | null;
    };
  };
}

/**
 * Creates notification routes
 *
 * @param notificationService - NotificationService instance for handling notification operations
 * @param authService - AuthService instance for authentication
 * @returns Hono app with notification routes configured
 */
export function createNotificationRoutes(
  notificationService: NotificationService,
  authService: AuthService
): Hono<NotificationContext> {
  const router = new Hono<NotificationContext>();

  /**
   * GET /notifications
   * List notifications for the authenticated user (requires authentication)
   *
   * Query parameters:
   * - page: number (optional, default: 1)
   * - limit: number (optional, default: 20, max: 100)
   * - unreadOnly: boolean (optional, default: false)
   *
   * Response:
   * {
   *   "notifications": [
   *     {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "type": "UPVOTE",
   *       "title": "New upvote!",
   *       "body": "John upvoted your project",
   *       "data": { ... },
   *       "read": false,
   *       "createdAt": "2025-01-15T12:00:00Z"
   *     }
   *   ],
   *   "total": 42,
   *   "page": 1,
   *   "limit": 20,
   *   "totalPages": 3
   * }
   */
  router.get('/', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Validate query parameters
    const queryValidation = notificationListQuerySchema.safeParse(c.req.query());

    if (!queryValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            fieldErrors: queryValidation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const query = queryValidation.data;

    logger.info({ userId: user.id, query }, 'Listing notifications');

    const result = await notificationService.list(user.id, query);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'List notifications failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id, count: result.value.notifications.length }, 'Notifications listed successfully');

    return c.json(result.value);
  });

  /**
   * PATCH /notifications/:id/read
   * Mark a notification as read (requires authentication)
   *
   * Response:
   * {
   *   "success": true
   * }
   */
  router.patch('/:id/read', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Validate notification ID parameter
    const paramValidation = notificationIdParamSchema.safeParse({ id: c.req.param('id') });

    if (!paramValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification ID',
            fieldErrors: paramValidation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const { id: notificationId } = paramValidation.data;

    logger.info({ userId: user.id, notificationId }, 'Mark notification as read attempt');

    const result = await notificationService.markAsRead(user.id, notificationId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, notificationId, error: error.message }, 'Mark notification as read failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id, notificationId }, 'Notification marked as read successfully');

    return c.json({ success: true });
  });

  /**
   * POST /notifications/read-all
   * Mark all notifications as read for the authenticated user (requires authentication)
   *
   * Response:
   * {
   *   "success": true
   * }
   */
  router.post('/read-all', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'Mark all notifications as read attempt');

    const result = await notificationService.markAllAsRead(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Mark all notifications as read failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id }, 'All notifications marked as read successfully');

    return c.json({ success: true });
  });

  /**
   * GET /notifications/unread-count
   * Get unread notification count for the authenticated user (requires authentication)
   *
   * Response:
   * {
   *   "count": 5
   * }
   */
  router.get('/unread-count', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    logger.info({ userId: user.id }, 'Get unread count attempt');

    const result = await notificationService.getUnreadCount(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Get unread count failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id, count: result.value.count }, 'Unread count retrieved successfully');

    return c.json(result.value);
  });

  /**
   * POST /notifications/push-token
   * Register a push token for the authenticated user (requires authentication)
   *
   * Request body:
   * {
   *   "token": "fcm-token-string",
   *   "platform": "IOS" | "ANDROID"
   * }
   *
   * Response:
   * {
   *   "success": true
   * }
   */
  router.post('/push-token', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
        },
        400
      );
    }

    const bodyValidation = registerPushTokenSchema.safeParse(body);

    if (!bodyValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            fieldErrors: bodyValidation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const { token, platform } = bodyValidation.data;

    logger.info({ userId: user.id, platform }, 'Register push token attempt');

    const result = await notificationService.registerPushToken(user.id, token, platform);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, platform, error: error.message }, 'Register push token failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id, platform }, 'Push token registered successfully');

    return c.json({ success: true });
  });

  /**
   * DELETE /notifications/push-token
   * Unregister a push token (requires authentication)
   *
   * Request body:
   * {
   *   "token": "fcm-token-string"
   * }
   *
   * Response:
   * {
   *   "success": true
   * }
   */
  router.delete('/push-token', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    if (!user) {
      logger.error('No user in context despite auth middleware');
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        401
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
        },
        400
      );
    }

    const bodyValidation = deletePushTokenSchema.safeParse(body);

    if (!bodyValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            fieldErrors: bodyValidation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const { token } = bodyValidation.data;

    logger.info({ userId: user.id }, 'Unregister push token attempt');

    const result = await notificationService.unregisterPushToken(token);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Unregister push token failed');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500;

      return c.json(
        {
          error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
          },
        },
        statusCode
      );
    }

    logger.info({ userId: user.id }, 'Push token unregistered successfully');

    return c.json({ success: true });
  });

  return router;
}
