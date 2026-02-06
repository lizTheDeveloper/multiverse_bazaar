/**
 * Idea routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for idea CRUD operations and interest management.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { IdeaService } from './service.js';
import {
  createIdeaSchema,
  updateIdeaSchema,
  expressInterestSchema,
  graduateIdeaSchema,
  ideaListQuerySchema,
} from './schemas.js';
import { authMiddleware, optionalAuthMiddleware } from '../auth/middleware.js';
import { AuthService } from '../auth/service.js';
import { Logger } from '../../infra/logger.js';

/**
 * Context variables available in idea routes
 */
interface IdeaContext {
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
 * Creates idea routes
 *
 * @param ideaService - IdeaService instance for handling idea operations
 * @param authService - AuthService instance for authentication
 * @returns Hono app with idea routes configured
 */
export function createIdeaRoutes(
  ideaService: IdeaService,
  authService: AuthService
): Hono<IdeaContext> {
  const router = new Hono<IdeaContext>();

  /**
   * GET /ideas
   * List ideas with pagination and filters
   * Public endpoint - no authentication required
   *
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   * - status: Filter by idea status (OPEN | CLOSED | GRADUATED)
   * - creatorId: Filter by creator user ID
   *
   * Response:
   * {
   *   "ideas": [...],
   *   "total": 42,
   *   "page": 1,
   *   "limit": 20,
   *   "totalPages": 3
   * }
   */
  router.get('/', async (c) => {
    const logger = c.get('logger');

    // Parse and validate query parameters
    const queryParams = c.req.query();
    const validation = ideaListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            fieldErrors: validation.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        400
      );
    }

    const query = validation.data;

    logger.info({ query }, 'Listing ideas');

    const result = await ideaService.list(query);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ query, error: error.message }, 'Failed to list ideas');

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

    logger.info(
      { query, total: result.value.total, page: result.value.page },
      'Ideas listed successfully'
    );

    return c.json(result.value);
  });

  /**
   * POST /ideas
   * Create a new idea
   * Requires authentication - creating user becomes idea creator
   *
   * Request body:
   * {
   *   "title": "My Idea",
   *   "description": "A cool idea",
   *   "lookingFor": "Co-founder, Designer, Developer"
   * }
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "title": "My Idea",
   *   ...
   *   "creator": { ... }
   * }
   */
  router.post('/', authMiddleware(authService), async (c) => {
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
    const validation = createIdeaSchema.safeParse(body);

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

    const data = validation.data;

    logger.info({ userId: user.id, title: data.title }, 'Creating idea');

    const result = await ideaService.create(user.id, data);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Failed to create idea');

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

    logger.info({ userId: user.id, ideaId: result.value.id }, 'Idea created successfully');

    return c.json(result.value, 201);
  });

  /**
   * GET /ideas/:id
   * Get a specific idea by ID with creator profile
   * Public endpoint - no authentication required
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "title": "My Idea",
   *   ...
   *   "creator": { ... }
   * }
   */
  router.get('/:id', async (c) => {
    const logger = c.get('logger');
    const ideaId = c.req.param('id');

    logger.info({ ideaId }, 'Fetching idea');

    const result = await ideaService.getById(ideaId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ ideaId, error: error.message }, 'Failed to fetch idea');

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

    logger.info({ ideaId }, 'Idea fetched successfully');

    return c.json(result.value);
  });

  /**
   * PATCH /ideas/:id
   * Update an idea
   * Requires authentication - only idea creator can update
   *
   * Request body (all fields optional):
   * {
   *   "title": "Updated Title",
   *   "description": "Updated description",
   *   "lookingFor": "Updated looking for",
   *   "status": "CLOSED"
   * }
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "title": "Updated Title",
   *   ...
   *   "creator": { ... }
   * }
   */
  router.patch('/:id', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const ideaId = c.req.param('id');

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
    const validation = updateIdeaSchema.safeParse(body);

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

    const data = validation.data;

    logger.info({ userId: user.id, ideaId }, 'Updating idea');

    const result = await ideaService.update(user.id, ideaId, data);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, ideaId, error: error.message }, 'Failed to update idea');

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

    logger.info({ userId: user.id, ideaId }, 'Idea updated successfully');

    return c.json(result.value);
  });

  /**
   * DELETE /ideas/:id
   * Delete an idea
   * Requires authentication - only idea creator can delete
   *
   * Response:
   * {
   *   "message": "Idea deleted successfully"
   * }
   */
  router.delete('/:id', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const ideaId = c.req.param('id');

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

    logger.info({ userId: user.id, ideaId }, 'Deleting idea');

    const result = await ideaService.delete(user.id, ideaId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, ideaId, error: error.message }, 'Failed to delete idea');

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

    logger.info({ userId: user.id, ideaId }, 'Idea deleted successfully');

    return c.json({
      message: 'Idea deleted successfully',
    });
  });

  /**
   * POST /ideas/:id/interest
   * Express interest in an idea
   * Requires authentication - user cannot express interest in their own idea
   *
   * Request body:
   * {
   *   "message": "Optional message to the creator"
   * }
   *
   * Response:
   * {
   *   "message": "Interest expressed successfully"
   * }
   */
  router.post('/:id/interest', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const ideaId = c.req.param('id');

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
    const validation = expressInterestSchema.safeParse(body);

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

    const data = validation.data;

    logger.info({ userId: user.id, ideaId }, 'Expressing interest in idea');

    const result = await ideaService.expressInterest(user.id, ideaId, data.message);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn(
        { userId: user.id, ideaId, error: error.message },
        'Failed to express interest'
      );

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

    logger.info({ userId: user.id, ideaId }, 'Interest expressed successfully');

    return c.json({
      message: 'Interest expressed successfully',
    }, 201);
  });

  /**
   * DELETE /ideas/:id/interest
   * Remove interest from an idea
   * Requires authentication
   *
   * Response:
   * {
   *   "message": "Interest removed successfully"
   * }
   */
  router.delete('/:id/interest', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const ideaId = c.req.param('id');

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

    logger.info({ userId: user.id, ideaId }, 'Removing interest from idea');

    const result = await ideaService.removeInterest(user.id, ideaId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn(
        { userId: user.id, ideaId, error: error.message },
        'Failed to remove interest'
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

    logger.info({ userId: user.id, ideaId }, 'Interest removed successfully');

    return c.json({
      message: 'Interest removed successfully',
    });
  });

  /**
   * POST /ideas/:id/graduate
   * Graduate an idea to a project
   * Requires authentication - only idea creator can graduate
   *
   * Request body:
   * {
   *   "projectId": "uuid" // Optional - if not provided, auto-creates project
   * }
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "title": "My Idea",
   *   "status": "GRADUATED",
   *   "graduatedToProjectId": "uuid",
   *   ...
   *   "creator": { ... }
   * }
   */
  router.post('/:id/graduate', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const ideaId = c.req.param('id');

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
    const validation = graduateIdeaSchema.safeParse(body);

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

    const data = validation.data;

    logger.info({ userId: user.id, ideaId, projectId: data.projectId }, 'Graduating idea');

    const result = await ideaService.graduate(user.id, ideaId, data);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, ideaId, error: error.message }, 'Failed to graduate idea');

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

    logger.info({ userId: user.id, ideaId }, 'Idea graduated successfully');

    return c.json(result.value);
  });

  return router;
}
