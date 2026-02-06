/**
 * Upvote routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for upvoting and removing upvotes on projects.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { UpvoteService } from './service.js';
import { projectIdParamSchema } from './schemas.js';
import { authMiddleware } from '../auth/middleware.js';
import { AuthService } from '../auth/service.js';
import { Logger } from '../../infra/logger.js';

/**
 * Context variables available in upvote routes
 */
interface UpvoteContext {
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
 * Creates upvote routes
 *
 * @param upvoteService - UpvoteService instance for handling upvote operations
 * @param authService - AuthService instance for authentication
 * @returns Hono app with upvote routes configured
 */
export function createUpvoteRoutes(
  upvoteService: UpvoteService,
  authService: AuthService
): Hono<UpvoteContext> {
  const router = new Hono<UpvoteContext>();

  /**
   * POST /projects/:id/upvote
   * Upvote a project (requires authentication)
   *
   * Response:
   * {
   *   "upvoted": true,
   *   "count": 42
   * }
   */
  router.post('/projects/:id/upvote', authMiddleware(authService), async (c) => {
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

    // Validate project ID parameter
    const paramValidation = projectIdParamSchema.safeParse({ id: c.req.param('id') });

    if (!paramValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid project ID',
            fieldErrors: paramValidation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const { id: projectId } = paramValidation.data;

    logger.info({ userId: user.id, projectId }, 'Upvote attempt');

    const result = await upvoteService.upvote(user.id, projectId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, projectId, error: error.message }, 'Upvote failed');

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

    logger.info({ userId: user.id, projectId }, 'Upvote successful');

    return c.json(result.value);
  });

  /**
   * DELETE /projects/:id/upvote
   * Remove upvote from a project (requires authentication)
   *
   * Response:
   * {
   *   "upvoted": false,
   *   "count": 41
   * }
   */
  router.delete('/projects/:id/upvote', authMiddleware(authService), async (c) => {
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

    // Validate project ID parameter
    const paramValidation = projectIdParamSchema.safeParse({ id: c.req.param('id') });

    if (!paramValidation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid project ID',
            fieldErrors: paramValidation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const { id: projectId } = paramValidation.data;

    logger.info({ userId: user.id, projectId }, 'Remove upvote attempt');

    const result = await upvoteService.removeUpvote(user.id, projectId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, projectId, error: error.message }, 'Remove upvote failed');

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

    logger.info({ userId: user.id, projectId }, 'Remove upvote successful');

    return c.json(result.value);
  });

  return router;
}
