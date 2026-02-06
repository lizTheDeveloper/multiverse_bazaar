/**
 * User routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for user profile management and privacy settings.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { UserService } from './service.js';
import {
  updateUserSchema,
  privacySettingsSchema,
  inviteExternalUserSchema,
} from './schemas.js';
import { Logger } from '../../infra/logger.js';

/**
 * Context variables available in user routes
 */
interface UserContext {
  Variables: {
    requestId: string;
    logger: Logger;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  };
}

/**
 * Creates user routes
 *
 * @param userService - UserService instance for handling user operations
 * @param authMiddleware - Authentication middleware function
 * @returns Hono app with user routes configured
 */
export function createUserRoutes(
  userService: UserService,
  authMiddleware: any
): Hono<UserContext> {
  const router = new Hono<UserContext>();

  /**
   * GET /users/me
   * Get current user's profile (requires authentication)
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "email": "user@example.com",
   *   "name": "User Name",
   *   "avatarUrl": "https://...",
   *   "bio": "User bio...",
   *   "karma": 0,
   *   "createdAt": "2024-01-01T00:00:00.000Z"
   * }
   */
  router.get('/me', authMiddleware, async (c) => {
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

    logger.info({ userId: user.id }, 'Get current user profile');

    const result = await userService.getMe(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Failed to get user profile');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

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

    return c.json(result.value);
  });

  /**
   * PATCH /users/me
   * Update current user's profile (requires authentication)
   *
   * Request body:
   * {
   *   "name": "New Name",      // optional
   *   "avatarUrl": "https://...",  // optional
   *   "bio": "New bio..."      // optional
   * }
   *
   * Response: Updated user profile
   */
  router.patch('/me', authMiddleware, async (c) => {
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
    const body = await c.req.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            fieldErrors: validation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    logger.info({ userId: user.id, fields: Object.keys(validation.data) }, 'Update user profile');

    const result = await userService.updateMe(user.id, validation.data);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Failed to update user profile');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

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

    return c.json(result.value);
  });

  /**
   * GET /users/:id
   * Get public profile for a user
   *
   * Response: Public user profile (respects privacy settings)
   */
  router.get('/:id', async (c) => {
    const logger = c.get('logger');
    const userId = c.req.param('id');

    logger.info({ userId }, 'Get public user profile');

    const result = await userService.getPublicProfile(userId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId, error: error.message }, 'Failed to get public profile');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

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

    return c.json(result.value);
  });

  /**
   * GET /me/privacy-settings
   * Get current user's privacy settings (requires authentication)
   *
   * Response:
   * {
   *   "showEmailOnProfile": false,
   *   "includeInSearch": true,
   *   "showActivityPublicly": false
   * }
   */
  router.get('/me/privacy-settings', authMiddleware, async (c) => {
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

    logger.info({ userId: user.id }, 'Get privacy settings');

    const result = await userService.getPrivacySettings(user.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Failed to get privacy settings');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

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

    return c.json(result.value);
  });

  /**
   * PATCH /me/privacy-settings
   * Update current user's privacy settings (requires authentication)
   *
   * Request body:
   * {
   *   "showEmailOnProfile": true,
   *   "includeInSearch": true,
   *   "showActivityPublicly": false
   * }
   *
   * Response: Updated privacy settings
   */
  router.patch('/me/privacy-settings', authMiddleware, async (c) => {
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
    const body = await c.req.json();
    const validation = privacySettingsSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            fieldErrors: validation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    logger.info({ userId: user.id, settings: validation.data }, 'Update privacy settings');

    const result = await userService.updatePrivacySettings(user.id, validation.data);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Failed to update privacy settings');

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

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

    return c.json(result.value);
  });

  /**
   * POST /users/invite
   * Invite an external user to collaborate on a project (requires authentication)
   *
   * Request body:
   * {
   *   "email": "external@example.com",
   *   "projectId": "uuid",
   *   "role": "CONTRIBUTOR" | "ADVISOR"
   * }
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "email": "external@example.com",
   *   "projectId": "uuid",
   *   "role": "CONTRIBUTOR",
   *   "token": "invitation-token",
   *   "expiresAt": "2024-01-08T00:00:00.000Z"
   * }
   */
  router.post('/invite', authMiddleware, async (c) => {
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
    const body = await c.req.json();
    const validation = inviteExternalUserSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            fieldErrors: validation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const { email, projectId, role } = validation.data;

    logger.info(
      { inviterId: user.id, email, projectId, role },
      'Invite external user to collaborate'
    );

    const result = await userService.inviteExternalUser(user.id, email, projectId, role);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn(
        { inviterId: user.id, email, projectId, error: error.message },
        'Failed to invite external user'
      );

      const statusCode = error.statusCode as 400 | 401 | 403 | 404 | 429 | 500;

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

    return c.json(result.value, 201);
  });

  return router;
}
