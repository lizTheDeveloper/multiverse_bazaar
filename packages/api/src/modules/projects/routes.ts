/**
 * Project routes for the Multiverse Bazaar API.
 * Defines HTTP endpoints for project CRUD operations.
 */

import { Hono } from 'hono';
import { isOk } from '@multiverse-bazaar/shared';
import { ProjectService } from './service.js';
import { createProjectSchema, updateProjectSchema, projectListQuerySchema } from './schemas.js';
import { authMiddleware, optionalAuthMiddleware } from '../auth/middleware.js';
import { AuthService } from '../auth/service.js';
import { Logger } from '../../infra/logger.js';

/**
 * Context variables available in project routes
 */
interface ProjectContext {
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
 * Creates project routes
 *
 * @param projectService - ProjectService instance for handling project operations
 * @param authService - AuthService instance for authentication
 * @returns Hono app with project routes configured
 */
export function createProjectRoutes(
  projectService: ProjectService,
  authService: AuthService
): Hono<ProjectContext> {
  const router = new Hono<ProjectContext>();

  /**
   * GET /projects
   * List projects with pagination and filters
   * Public endpoint - optional authentication for upvote status
   *
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   * - status: Filter by project status (BUILDING | LAUNCHED)
   * - featured: Filter by featured status (true | false)
   * - creatorId: Filter by creator user ID
   *
   * Response:
   * {
   *   "projects": [...],
   *   "total": 42,
   *   "page": 1,
   *   "limit": 20,
   *   "totalPages": 3
   * }
   */
  router.get('/', optionalAuthMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');

    // Parse and validate query parameters
    const queryParams = c.req.query();
    const validation = projectListQuerySchema.safeParse(queryParams);

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

    logger.info({ query, userId: user?.id }, 'Listing projects');

    const result = await projectService.list(query, user?.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ query, error: error.message }, 'Failed to list projects');

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
      'Projects listed successfully'
    );

    return c.json(result.value);
  });

  /**
   * POST /projects
   * Create a new project
   * Requires authentication - creating user becomes project creator
   *
   * Request body:
   * {
   *   "title": "My Project",
   *   "description": "A cool project",
   *   "url": "https://example.com",
   *   "repoUrl": "https://github.com/user/repo",
   *   "imageUrl": "https://example.com/image.png",
   *   "status": "BUILDING"
   * }
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "title": "My Project",
   *   ...
   *   "upvoteCount": 0,
   *   "hasUpvoted": false
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
    const validation = createProjectSchema.safeParse(body);

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

    logger.info({ userId: user.id, title: data.title }, 'Creating project');

    const result = await projectService.create(user.id, data);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, error: error.message }, 'Failed to create project');

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

    logger.info({ userId: user.id, projectId: result.value.id }, 'Project created successfully');

    return c.json(result.value, 201);
  });

  /**
   * GET /projects/:id
   * Get a specific project by ID with collaborators and upvote info
   * Public endpoint - optional authentication for upvote status
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "title": "My Project",
   *   ...
   *   "collaborators": [...],
   *   "upvoteCount": 42,
   *   "hasUpvoted": true
   * }
   */
  router.get('/:id', optionalAuthMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const projectId = c.req.param('id');

    logger.info({ projectId, userId: user?.id }, 'Fetching project');

    const result = await projectService.getById(projectId, user?.id);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ projectId, error: error.message }, 'Failed to fetch project');

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

    logger.info({ projectId, userId: user?.id }, 'Project fetched successfully');

    return c.json(result.value);
  });

  /**
   * PATCH /projects/:id
   * Update a project
   * Requires authentication - only project creator can update
   *
   * Request body (all fields optional):
   * {
   *   "title": "Updated Title",
   *   "description": "Updated description",
   *   "url": "https://new-url.com",
   *   "repoUrl": "https://github.com/user/new-repo",
   *   "imageUrl": "https://new-image.com/image.png",
   *   "status": "LAUNCHED"
   * }
   *
   * Response:
   * {
   *   "id": "uuid",
   *   "title": "Updated Title",
   *   ...
   *   "upvoteCount": 42,
   *   "hasUpvoted": true
   * }
   */
  router.patch('/:id', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const projectId = c.req.param('id');

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
    const validation = updateProjectSchema.safeParse(body);

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

    logger.info({ userId: user.id, projectId }, 'Updating project');

    const result = await projectService.update(user.id, projectId, data);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, projectId, error: error.message }, 'Failed to update project');

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

    logger.info({ userId: user.id, projectId }, 'Project updated successfully');

    return c.json(result.value);
  });

  /**
   * DELETE /projects/:id
   * Delete a project
   * Requires authentication - only project creator can delete
   *
   * Response:
   * {
   *   "message": "Project deleted successfully"
   * }
   */
  router.delete('/:id', authMiddleware(authService), async (c) => {
    const logger = c.get('logger');
    const user = c.get('user');
    const projectId = c.req.param('id');

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

    logger.info({ userId: user.id, projectId }, 'Deleting project');

    const result = await projectService.delete(user.id, projectId);

    if (!isOk(result)) {
      const error = result.error;
      logger.warn({ userId: user.id, projectId, error: error.message }, 'Failed to delete project');

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

    logger.info({ userId: user.id, projectId }, 'Project deleted successfully');

    return c.json({
      message: 'Project deleted successfully',
    });
  });

  return router;
}
